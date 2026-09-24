import {
  bsd,
  BsdFixtureSummary,
  BsdH2hResponse,
  BsdStandingRow,
} from "../clients/bsdClient";
import { getCompetition, Competition } from "../data/competitions";
import { crestColorFor, slugify } from "../data/teamDirectory";
import { errMsg, positionGroup } from "../utils";
import {
  H2hAggregates,
  HeadToHeadMatch,
  Injury,
  Intent,
  Lineup,
  RetrievalResult,
  RetrievedTeamData,
  TeamId,
  TeamStats,
} from "../types";

export async function runDataRetrievalAgent(
  intent: Intent
): Promise<RetrievalResult> {
  return retrieveFromBsd(intent);
}

// --- BSD provider (default) -------------------------------------------------

async function retrieveFromBsd(intent: Intent): Promise<RetrievalResult> {
  const comp = getCompetition(intent.competition);
  if (!comp) throw new Error(`Unknown competition "${intent.competition}"`);

  const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
  // Identity is the name slug, so any team in the table resolves.
  const rowBySlug = new Map(table.standings.map((r) => [slugify(r.team), r]));

  const rowA = rowBySlug.get(intent.teamA);
  const rowB = rowBySlug.get(intent.teamB);
  // A club not in the pinned season's standings (newly promoted, UCL qualifier)
  // degrades to an empty team instead of failing the comparison — the
  // validation agent flags the gap and the UI shows a "no data" card.
  const [teamA, teamB, h2h] = await Promise.all([
    rowA ? buildBsdTeam(intent.teamA, rowA, comp) : emptyTeamData(intent.teamA),
    rowB ? buildBsdTeam(intent.teamB, rowB, comp) : emptyTeamData(intent.teamB),
    rowA && rowB
      ? fetchH2h(rowA, rowB, intent.teamA, intent.teamB, comp)
      : { matches: [] as HeadToHeadMatch[], aggregates: undefined },
  ]);

  return { teamA, teamB, headToHead: h2h.matches, headToHeadAggregates: h2h.aggregates };
}

/** Zeroed team data for a club absent from the pinned season's standings. */
function emptyTeamData(teamId: TeamId): RetrievedTeamData {
  return {
    stats: {
      teamId,
      name: teamId,
      crestColor: crestColorFor(teamId),
      standingPosition: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      form: [],
      attackRating: 0,
      defenseRating: 0,
      possessionAvg: 0,
    },
    injuries: [],
  };
}

async function buildBsdTeam(
  teamId: TeamId,
  row: BsdStandingRow,
  comp: Competition
): Promise<RetrievedTeamData> {
  const news = await fetchTeamNews(teamId, row, comp);
  return { stats: bsdRowToStats(teamId, row), ...news };
}

/**
 * Best-effort team news (injuries + latest lineup) from the team's most recent
 * finished event. BSD embeds both in the v2 lineups payload: per-side
 * `unavailable_players` and the confirmed/predicted XI. A team whose fixture
 * has no data — or a call that fails — degrades to an empty report rather than
 * failing the comparison.
 *
 * Injuries/lineups come from the LIVE season, not the pinned completed season
 * used for stats: a frozen season's last event lists players who have since
 * transferred (e.g. Jesus still "injured" for Arsenal post-Barça move).
 * Falls back to the pinned season when no live season exists yet.
 */
async function fetchTeamNews(
  teamId: TeamId,
  row: BsdStandingRow,
  comp: Competition
): Promise<{ injuries: Injury[]; lineup?: Lineup }> {
  try {
    console.log(`[retrieval] ${teamId}: fetching fixtures + latest lineup...`);
    const season = await bsd.liveSeason(comp.bsdLeague).catch(() => comp.bsdSeason);
    const fixtures = await bsd.teamFixtures(
      comp.bsdLeague,
      season,
      row.team_id
    );
    const lastFinished = fixtures.results
      .filter((f) => f.status === "finished")
      .sort((a, b) => b.event_date.localeCompare(a.event_date))[0];
    if (!lastFinished) return { injuries: [] };

    const event = await bsd.v2Lineups(lastFinished.id);
    const sides = event.lineups;
    if (!sides) return { injuries: [] };

    const isHome = sides.home?.team_id === row.team_id;
    const side = isHome ? sides.home : sides.away;
    const unavailable = isHome
      ? event.unavailable_players?.home ?? []
      : event.unavailable_players?.away ?? [];

    const injuries: Injury[] = unavailable.map((u) => ({
      playerName: u.name,
      // BSD reports the injury/suspension reason rather than a playing
      // position; the field is reused to keep the shape stable.
      position: u.reason || "Unknown",
      status: u.status === "doubtful" ? "doubtful" : "out",
      expectedReturn: u.expected_return ?? "Unknown",
    }));

    const lineup: Lineup | undefined = side
      ? {
          formation: side.formation,
          confidence: side.confidence ?? undefined,
          confirmed: event.lineup_status === "confirmed",
          startingXI: side.players.map(mapBsdPlayer),
          substitutes: (side.substitutes ?? []).map(mapBsdPlayer),
        }
      : undefined;

    return { lineup, injuries };
  } catch (err) {
    console.warn(
      `[dataRetrievalAgent] team news unavailable for ${teamId}: ${errMsg(err)}`
    );
    return { injuries: [] };
  }
}

/** BSD player positions are single letters (G/D/M/F); expand to a group label. */
function mapBsdPlayer(p: {
  name: string;
  position?: string;
  jersey_number?: number | null;
  ai_score?: number | null;
  captain?: boolean;
}): Lineup["startingXI"][number] {
  return {
    name: p.name,
    position: positionGroup(p.position),
    jerseyNumber: p.jersey_number ?? undefined,
    aiScore: p.ai_score != null ? Math.round(p.ai_score * 100) : undefined,
    captain: p.captain,
  };
}

/**
 * Head-to-head from the mutual event between the two clubs (BSD exposes it as
 * `v2/events/{id}/h2h/`). Fixture-side names ("Liverpool FC") are resolved
 * back to our slugs through the id-keyed fixture list, so home/away attribution
 * in the report stays correct even when standings names differ.
 */
async function fetchH2h(
  rowA: BsdStandingRow,
  rowB: BsdStandingRow,
  teamASlug: TeamId,
  teamBSlug: TeamId,
  comp: Competition
): Promise<{ matches: HeadToHeadMatch[]; aggregates?: H2hAggregates }> {
  try {
    console.log(`[retrieval] ${teamASlug} vs ${teamBSlug}: finding mutual fixture...`);
    const fixtures = await bsd.teamFixtures(
      comp.bsdLeague,
      comp.bsdSeason,
      rowA.team_id
    );
    const mutual = fixtures.results.find(
      (f) =>
        (f.home_team_obj?.id === rowA.team_id &&
          f.away_team_obj?.id === rowB.team_id) ||
        (f.home_team_obj?.id === rowB.team_id &&
          f.away_team_obj?.id === rowA.team_id)
    );
    if (!mutual) return { matches: [] };

    const h2h = await bsd.v2H2h(mutual.id);

    const idToSlug = new Map<number, TeamId>([
      [rowA.team_id, teamASlug],
      [rowB.team_id, teamBSlug],
    ]);
    const nameToId = new Map<string, number>();
    for (const f of fixtures.results) {
      if (f.home_team_obj) nameToId.set(slugify(f.home_team), f.home_team_obj.id);
      if (f.away_team_obj) nameToId.set(slugify(f.away_team), f.away_team_obj.id);
    }
    const resolve = (name: string): TeamId => {
      const id = nameToId.get(slugify(name));
      return id ? (idToSlug.get(id) ?? slugify(name)) : slugify(name);
    };

    const matches = h2h.recent_matches
      .map((m) => {
        const [homeGoals, awayGoals] = m.score
          .split("-")
          .map((n) => parseInt(n, 10));
        if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) return null;
        return {
          date: m.date.slice(0, 10),
          homeTeam: resolve(m.home),
          awayTeam: resolve(m.away),
          homeGoals,
          awayGoals,
        };
      })
      .filter((m): m is HeadToHeadMatch => m !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);

    return { matches, aggregates: toAggregates(h2h, mutual, idToSlug, teamASlug) };
  } catch (err) {
    console.warn(
      `[dataRetrievalAgent] H2H unavailable for ${rowA.team_id} vs ${rowB.team_id}: ${errMsg(err)}`
    );
    return { matches: [] };
  }
}

/**
 * Cross-season aggregates framed from team A's perspective. Rates derive from
 * BSD's counts (its own rate fields are an unverified scale). The payload's
 * home/away is the mutual event's framing, so attribute via its club ids.
 */
function toAggregates(
  h2h: BsdH2hResponse,
  mutual: BsdFixtureSummary,
  idToSlug: Map<number, TeamId>,
  teamASlug: TeamId
): H2hAggregates | undefined {
  const total = h2h.total_matches || 0;
  if (total <= 0) return undefined;
  const aHome = mutual.home_team_obj
    ? idToSlug.get(mutual.home_team_obj.id) === teamASlug
    : true;
  const winsA = aHome ? h2h.home_wins : h2h.away_wins;
  const winsB = aHome ? h2h.away_wins : h2h.home_wins;
  const pct = (n: number) => Math.round((n / total) * 100);
  return {
    totalMatches: total,
    winsA,
    draws: h2h.draws,
    winsB,
    avgTotalGoals: Math.round(h2h.avg_total_goals * 10) / 10,
    winRateA: pct(winsA),
    drawRate: pct(h2h.draws),
    winRateB: pct(winsB),
  };
}

export function bsdRowToStats(teamId: TeamId, row: BsdStandingRow): TeamStats {
  const played = row.played || 1;
  const pointsPerGame = row.pts / played;

  // Prefer expected goals (xG) when available — it is a better skill signal
  // than raw goals. Fall back to actual goals for seasons without xG.
  const hasXg = row.xg_games > 0;
  const xgfPerGame = hasXg ? row.xgf / row.xg_games : row.gf / played;
  const xgaPerGame = hasXg ? row.xga / row.xg_games : row.ga / played;

  return {
    teamId,
    name: row.team,
    crestColor: crestColorFor(row.team),
    standingPosition: row.position,
    played,
    wins: row.won,
    draws: row.drawn,
    losses: row.lost,
    goalsFor: row.gf,
    goalsAgainst: row.ga,
    form: parseForm(row.form),
    // ~2.5 xG/game ≈ elite chance creation/suppression; constants are tunable.
    attackRating: clamp01to100((xgfPerGame / 2.5) * 100),
    defenseRating: clamp01to100((1 - xgaPerGame / 2.5) * 100),
    // Raw per-game xG for surfaces that want numbers, not just ratings —
    // omitted when the season has no xG (the ratings already fell back).
    ...(hasXg
      ? {
          expectedGoalsFor: Math.round(xgfPerGame * 100) / 100,
          expectedGoalsAgainst: Math.round(xgaPerGame * 100) / 100,
        }
      : {}),
    // BSD does not expose possession, so this is an estimate from results
    // strength (points/game), not measured possession.
    possessionAvg: clamp01to100(40 + (pointsPerGame / 3) * 25),
  };
}

// --- shared helpers ---------------------------------------------------------

/** Take the last 5 results as W/D/L. */
function parseForm(form: string): string[] {
  return (form ?? "")
    .slice(-5)
    .split("")
    .filter((c) => ["W", "D", "L"].includes(c));
}

function clamp01to100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
