import { bsd, BsdFixtureSummary } from "../clients/bsdClient";
import { COMPETITIONS, Competition, getCompetition } from "../data/competitions";
import { crestColorFor, slugify } from "../data/teamDirectory";
import { config } from "../config";
import { getLiveSeasonId } from "./liveSeason";

export type FixturesStatus = "all" | "finished" | "scheduled" | "live";

// BSD fixture status literal for in-progress matches. Not yet observed in the
// wild — probed across five leagues during European pre-season when nothing
// was in play (Brazilian Serie A has been on break since 26 Jul). Pin it the
// first time a real matchday confirms the spelling.
const LIVE_STATUS = "live";

export interface FixtureTeam {
  /** Preview-style slug (slugify of the name) — matches the preview picker ids. */
  id: string;
  name: string;
  crestColor: string;
}

export interface Fixture {
  competition: string;
  competitionName: string;
  country: string;
  eventId: number;
  date: string;
  status: "finished" | "scheduled" | "live";
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  homeScore: number | null;
  awayScore: number | null;
}

/**
 * Recent results and upcoming fixtures per competition, for the fixtures
 * landing view. Data comes from the live season (the pinned completed seasons
 * carry no fixtures). Fetching by explicit BSD status (`finished`/`notstarted`)
 * means in-progress matches are simply not part of the feed — no live filter.
 */

const FINISHED_CAP = 20; // most recent results per league
const SCHEDULED_CAP = 30; // soonest upcoming matches per league
// The live season has hundreds of fixtures per league; cap how far we page so
// a cold "all leagues" hit stays cheap. One page comfortably covers both caps
// at season start; two pages keep recent results correct well into a season.
const MAX_PAGES = 2;

const CACHE_TTL_MS = 1000 * 60 * 10;
const fixturesCache = new Map<string, { expires: number; value: Fixture[] }>();

function cachedFixtures(key: string): Fixture[] | undefined {
  const entry = fixturesCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value;
  return undefined;
}

export async function listFixtures(
  competition: string | undefined,
  status: FixturesStatus
): Promise<Fixture[]> {
  if (config.useMockData) return mockFixtures(competition);

  const key = `${competition ?? "all"}|${status}`;
  const cached = cachedFixtures(key);
  if (cached) return cached;

  const comps =
    competition === undefined
      ? COMPETITIONS
      : (() => {
          const comp = getCompetition(competition);
          if (!comp) throw new Error(`Unknown competition "${competition}"`);
          return [comp];
        })();

  const started = Date.now();
  const perLeague = await Promise.all(comps.map((comp) => leagueFixtures(comp, status)));

  const fixtures = perLeague.flat();
  fixturesCache.set(key, { expires: Date.now() + CACHE_TTL_MS, value: fixtures });
  console.log(`[fixtures] ${fixtures.length} matches (${competition ?? "all"}, ${status}) in ${Date.now() - started}ms`);
  return fixtures;
}

async function leagueFixtures(comp: Competition, status: FixturesStatus): Promise<Fixture[]> {
  const liveSeason = await getLiveSeasonId(comp);

  const wantFinished = status === "all" || status === "finished";
  const wantScheduled = status === "all" || status === "scheduled";
  const wantLive = status === "all" || status === "live";

  const [finished, live, scheduled] = await Promise.all([
    wantFinished ? fetchStatus(comp, liveSeason, "finished") : Promise.resolve([]),
    wantLive ? fetchStatus(comp, liveSeason, LIVE_STATUS) : Promise.resolve([]),
    wantScheduled ? fetchStatus(comp, liveSeason, "notstarted") : Promise.resolve([]),
  ]);

  // Cap before merging: the recent results + the soonest upcoming.
  const finishedSorted = [...finished]
    .sort((a, b) => b.event_date.localeCompare(a.event_date))
    .slice(0, FINISHED_CAP);
  const liveSorted = [...live].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const scheduledSorted = [...scheduled]
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, SCHEDULED_CAP);

  const picked =
    status === "finished"
      ? finishedSorted
      : status === "scheduled"
        ? scheduledSorted
        : status === "live"
          ? liveSorted
          : [...liveSorted, ...finishedSorted, ...scheduledSorted];

  const fixtures = picked.map(mapFixture(comp));
  return fixtures;
}

async function fetchStatus(
  comp: Competition,
  liveSeason: number,
  bsdStatus: string
): Promise<BsdFixtureSummary[]> {
  const all: BsdFixtureSummary[] = [];
  for (let offset = 0; offset < MAX_PAGES * 100; offset += 100) {
    const page = await bsd.leagueFixtures(comp.bsdLeague, liveSeason, 100, offset, bsdStatus);
    all.push(...page.results);
    if (page.results.length < 100 || !page.next) break;
  }
  return all;
}

function mapFixture(comp: Competition): (f: BsdFixtureSummary) => Fixture {
  return (f) => {
    const homeName = f.home_team_obj?.name ?? f.home_team;
    const awayName = f.away_team_obj?.name ?? f.away_team;
    return {
      competition: comp.id,
      competitionName: comp.name,
      country: comp.country,
      eventId: f.id,
      date: f.event_date,
      status: f.status === "finished" ? "finished" : f.status === LIVE_STATUS ? "live" : "scheduled",
      homeTeam: {
        id: slugify(homeName),
        name: homeName,
        crestColor: crestColorFor(homeName),
      },
      awayTeam: {
        id: slugify(awayName),
        name: awayName,
        crestColor: crestColorFor(awayName),
      },
      homeScore: f.home_score,
      awayScore: f.away_score,
    };
  };
}

/** Mock fixtures cover only the two clubs with mock data (Arsenal/Chelsea). */
function mockFixtures(competition?: string): Fixture[] {
  const comp = getCompetition("premier-league");
  if (!comp || (competition && competition !== comp.id)) return [];
  const base: Fixture = {
    competition: comp.id,
    competitionName: comp.name,
    country: comp.country,
    eventId: 999,
    date: "2026-08-15T15:00:00Z",
    status: "scheduled",
    homeTeam: { id: "arsenal", name: "Arsenal", crestColor: "#EF0107" },
    awayTeam: { id: "chelsea", name: "Chelsea", crestColor: "#034694" },
    homeScore: null,
    awayScore: null,
  };
  const mk = (over: Partial<Fixture>): Fixture => ({ ...base, ...over });
  return [
    mk({ eventId: 1, date: "2026-08-10T19:00:00Z", status: "finished", homeTeam: { ...base.homeTeam }, awayTeam: { ...base.awayTeam }, homeScore: 3, awayScore: 0 }),
    mk({ eventId: 2, date: "2026-08-15T15:00:00Z", status: "scheduled", homeTeam: { ...base.awayTeam }, awayTeam: { ...base.homeTeam } }),
  ];
}
