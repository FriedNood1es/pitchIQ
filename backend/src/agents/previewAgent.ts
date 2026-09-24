import { bsd, BsdPredictedStarter } from "../clients/bsdClient";
import { COMPETITIONS, getCompetition } from "../data/competitions";
import { crestColorFor, slugify } from "../data/teamDirectory";
import { errMsg, positionGroup } from "../utils";
import {
  Lineup,
  PredictedLineupPlayer,
  PreviewEvent,
  PreviewReport,
  TeamId,
  TeamSummary,
  TeamPreview,
} from "../types";

export interface PreviewTeam extends TeamSummary {
  bsdTeamId: number;
}

// Team identity is session-stable — cached an hour so the search index stays
// warm across a long session without rebuilding.
const BASE_TTL_MS = 1000 * 60 * 60;
const previewTeamsBaseCache = new Map<string, { expires: number; value: PreviewTeam[] }>();

/**
 * Assemble a competition's preview team list from its live-season fixtures.
 * Cached ~1h. The expensive step is the fixture pagination; BSD has no crest
 * artwork, so the list is simply the club identity (crestColor for monograms).
 */
async function buildBaseTeams(competition: string): Promise<PreviewTeam[]> {
  const cached = previewTeamsBaseCache.get(competition);
  if (cached && cached.expires > Date.now()) return cached.value;

  const comp = getCompetition(competition);
  if (!comp) throw new Error(`Unknown competition "${competition}"`);

  console.log(`[preview] resolving live season for ${comp.name}...`);
  const liveSeason = await bsd.liveSeason(comp.bsdLeague);

  const bySlug = new Map<string, PreviewTeam>();
  const byId = new Map<number, string>();
  for (let offset = 0; offset < 1000; offset += 100) {
    console.log(
      `[preview] fetching ${comp.name} fixtures (offset ${offset})...`
    );
    const page = await bsd.leagueFixtures(
      comp.bsdLeague,
      liveSeason,
      100,
      offset,
      "notstarted"
    );
    for (const f of page.results) {
      for (const obj of [f.home_team_obj, f.away_team_obj]) {
        if (!obj) continue;
        const name = obj.name ?? "";
        const slug = slugify(name);
        if (byId.has(obj.id)) continue;
        byId.set(obj.id, slug);
        bySlug.set(slug, {
          id: slug,
          name,
          crestColor: crestColorFor(name),
          bsdTeamId: obj.id,
        });
      }
    }
    if (page.results.length < 100) break;
  }

  const teams = Array.from(bySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  previewTeamsBaseCache.set(competition, {
    expires: Date.now() + BASE_TTL_MS,
    value: teams,
  });
  return teams;
}

/**
 * Teams with upcoming fixtures in a competition's live season. Derived from
 * the fixture list (not standings — live-season tables are empty), so newly
 * promoted clubs are included. The list is identity-only (BSD has no crest
 * artwork); the UI renders colour monograms from `crestColor`.
 */
export async function listPreviewTeams(competition: string): Promise<PreviewTeam[]> {
  return buildBaseTeams(competition);
}

export async function runPreviewAgent(
  competition: string,
  team: TeamId
): Promise<PreviewReport> {
  return bsdPreview(competition, team);
}

/** Preview the predicted lineups for a team's next upcoming fixture. */
async function bsdPreview(
  competition: string,
  teamSlug: TeamId
): Promise<PreviewReport> {
  const comp = getCompetition(competition);
  if (!comp) {
    return emptyPreview(competition, teamSlug, `Unknown competition "${competition}"`);
  }

  try {
    const teams = await listPreviewTeams(competition);
    const team = teams.find((t) => t.id === teamSlug);
    if (!team) {
      return emptyPreview(
        competition,
        teamSlug,
        `"${teamSlug}" has no upcoming fixture in ${comp.name}.`
      );
    }

    const liveSeason = await bsd.liveSeason(comp.bsdLeague);

    const fixtures = await bsd.teamFixtures(
      comp.bsdLeague,
      liveSeason,
      team.bsdTeamId,
      20,
      "notstarted"
    );
    const next = fixtures.results.sort((a, b) =>
      a.event_date.localeCompare(b.event_date)
    )[0];
    if (!next) {
      return emptyPreview(
        competition,
        teamSlug,
        `No upcoming fixture scheduled for ${team.name}.`
      );
    }

    console.log(
      `[preview] ${team.name}: next up ${next.home_team} vs ${next.away_team} (event ${next.id}); fetching predicted lineups...`
    );
    const predicted = await bsd.predictedLineup(next.id);
    const event: PreviewEvent = {
      id: predicted.event.id,
      homeTeam: predicted.event.home_team,
      awayTeam: predicted.event.away_team,
      date: predicted.event.date,
      status: predicted.event.status,
    };

    return {
      competition,
      team: teamSlug,
      event,
      home: mapSide(predicted.lineups.home),
      away: mapSide(predicted.lineups.away),
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(
      `[previewAgent] preview unavailable for ${teamSlug}: ${err instanceof Error ? err.message : String(err)}`
    );
    return emptyPreview(
      competition,
      teamSlug,
      "Predicted lineups are unavailable for this team right now."
    );
  }
}

function mapSide(side: {
  team: string;
  predicted_formation: string;
  confidence: number;
  starters: BsdPredictedStarter[];
}): TeamPreview {
  return {
    name: side.team,
    formation: side.predicted_formation,
    confidence: Math.round(side.confidence) / 100,
    starters: side.starters.map(mapStarter),
  };
}

/** BSD positions are single letters (G/D/M/F); expand to a group label. */
function mapStarter(p: BsdPredictedStarter): PredictedLineupPlayer {
  return {
    name: p.name,
    position: positionGroup(p.position),
    jerseyNumber: p.jersey_number ?? undefined,
    aiScore: p.ai_score,
    predictedSlot: p.predicted_slot ?? undefined,
    availability: p.availability,
    injuryType: p.injury_type,
  };
}

function emptyPreview(
  competition: string,
  team: TeamId,
  message: string
): PreviewReport {
  return {
    competition,
    team,
    home: { name: "", formation: "", starters: [] },
    away: { name: "", formation: "", starters: [] },
    message,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Standings slug -> preview team (the two slug schemes differ: compare uses
 * standings names, preview uses live-fixture names). Tiers mirror the
 * standings matcher, one-directional — the preview slug carries the extra
 * affix ("liverpool-fc" vs "liverpool"), never the reverse.
 */
function resolvePreviewTeam(teams: PreviewTeam[], slug: TeamId): PreviewTeam | undefined {
  return (
    teams.find((t) => t.id === slug) ??
    teams.find((t) => slugify(t.name) === slug) ??
    teams.find((t) => slugify(t.name).includes(slug))
  );
}

/**
 * Predicted next XI for one club, mapped to the shared Lineup shape so the
 * compare report reuses the same rendering as confirmed lineups. Undefined
 * when the club has no upcoming fixture or the model has nothing — the
 * section hides instead of erroring.
 */
async function predictedLineupFor(
  competition: string,
  standingsSlug: TeamId
): Promise<Lineup | undefined> {
  const comp = getCompetition(competition);
  if (!comp) return undefined;
  const teams = await listPreviewTeams(competition);
  const team = resolvePreviewTeam(teams, standingsSlug);
  if (!team) return undefined;

  const liveSeason = await bsd.liveSeason(comp.bsdLeague);
  const fixtures = await bsd.teamFixtures(
    comp.bsdLeague,
    liveSeason,
    team.bsdTeamId,
    20,
    "notstarted"
  );
  const next = fixtures.results.sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  )[0];
  if (!next) return undefined;

  const predicted = await bsd.predictedLineup(next.id);
  const ours =
    slugify(next.home_team) === slugify(team.name)
      ? predicted.lineups.home
      : predicted.lineups.away;
  const side = mapSide(ours);
  return {
    formation: side.formation,
    confidence: side.confidence,
    confirmed: false,
    startingXI: side.starters.map((p) => ({
      name: p.name,
      position: p.position,
      jerseyNumber: p.jerseyNumber,
      aiScore: p.aiScore,
    })),
    substitutes: [],
  };
}

/**
 * Predicted next XIs for both compare clubs. Each side degrades to undefined
 * independently; runs in parallel with the news agent in the orchestrator.
 */
export async function getPredictedLineups(
  competition: string,
  teamA: TeamId,
  teamB: TeamId
): Promise<{ teamA?: Lineup; teamB?: Lineup }> {
  const [a, b] = await Promise.all([
    predictedLineupFor(competition, teamA).catch((err) => {
      console.warn(`[previewAgent] predicted XI unavailable for ${teamA}: ${errMsg(err)}`);
      return undefined;
    }),
    predictedLineupFor(competition, teamB).catch((err) => {
      console.warn(`[previewAgent] predicted XI unavailable for ${teamB}: ${errMsg(err)}`);
      return undefined;
    }),
  ]);
  return { ...(a ? { teamA: a } : {}), ...(b ? { teamB: b } : {}) };
}

/**
 * Pre-build every competition's team list at boot so the first search after
 * startup is instant instead of cold-building the whole index. Runs in the
 * background; the server is already listening when it finishes.
 */
export async function warmSearchIndex(): Promise<void> {
  const started = Date.now();
  await Promise.all(
    COMPETITIONS.map(async (comp) => {
      try {
        await listPreviewTeams(comp.id);
      } catch (err) {
        console.warn(
          `[preview] index warm skipped ${comp.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );
  console.log(`[preview] search index warm in ${Date.now() - started}ms`);
}
