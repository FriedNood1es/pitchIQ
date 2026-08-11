import { bsd } from "../clients/bsdClient";
import { config } from "../config";
import { getCompetition } from "../data/competitions";
import { slugify } from "../data/teamDirectory";
import { getTeamData } from "../mocks/teams";
import { TeamStats } from "../types";
import { bsdRowToStats } from "./dataRetrievalAgent";

/**
 * Season stats for a single team, resolved by display name against the
 * pinned (completed) season's standings. Standings names and the live-season
 * fixture names used by search/preview differ in a few cases (e.g. "Feyenoord
 * Rotterdam" vs "Feyenoord"), so matching falls back through exact -> slugified
 * -> substring before giving up.
 */
export async function getTeamStats(
  competition: string,
  name: string
): Promise<TeamStats> {
  if (config.useMockData) {
    return getTeamData(slugify(name)).stats;
  }

  const comp = getCompetition(competition);
  if (!comp) throw new Error(`Unknown competition "${competition}"`);

  const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
  const row =
    table.standings.find((r) => r.team === name) ??
    table.standings.find((r) => slugify(r.team) === slugify(name)) ??
    table.standings.find((r) => r.team.toLowerCase().includes(name.toLowerCase()));
  if (!row) throw new Error(`"${name}" not found in ${comp.name}`);

  return bsdRowToStats(slugify(row.team), row);
}
