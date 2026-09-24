import { bsd, BsdStandingRow } from "../clients/bsdClient";
import { getCompetition } from "../data/competitions";
import { slugify } from "../data/teamDirectory";
import { TeamStats } from "../types";
import { bsdRowToStats } from "./dataRetrievalAgent";

/**
 * Display name -> standings row against the pinned (completed) season.
 * Standings names and the live-season fixture names used by search/preview
 * differ in a few cases (e.g. "Feyenoord Rotterdam" vs "Feyenoord"), so
 * matching falls back through exact -> slugified -> substring before giving
 * up. Shared by team-stats and team-news so the tiers can't drift apart.
 */
export function resolveStandingsRow(
  standings: BsdStandingRow[],
  name: string
): BsdStandingRow | undefined {
  return (
    standings.find((r) => r.team === name) ??
    standings.find((r) => slugify(r.team) === slugify(name)) ??
    standings.find((r) => r.team.toLowerCase().includes(name.toLowerCase()))
  );
}

/**
 * Season stats for a single team, resolved by display name against the
 * pinned (completed) season's standings.
 */
export async function getTeamStats(
  competition: string,
  name: string
): Promise<TeamStats> {
  const comp = getCompetition(competition);
  if (!comp) throw new Error(`Unknown competition "${competition}"`);

  const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
  const row = resolveStandingsRow(table.standings, name);
  if (!row) throw new Error(`"${name}" not found in ${comp.name}`);

  return bsdRowToStats(slugify(row.team), row);
}
