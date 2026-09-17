import { bsdRowToStats } from "../agents/dataRetrievalAgent";
import { bsd } from "../clients/bsdClient";
import { config } from "../config";
import { TeamStats } from "../types";
import { getCompetition } from "./competitions";
import { slugify } from "./teamDirectory";

/**
 * Full pinned-season table, ordered by position. Lives here (not
 * teamDirectory) because it maps rows through the retrieval agent, which
 * already depends on teamDirectory — the reverse import would be a cycle.
 * Empty under mock data: mocks cover compare only, and a table of two
 * invented clubs would be worse than none.
 */
export async function listStandings(competitionId: string): Promise<TeamStats[]> {
  if (config.useMockData) return [];
  const comp = getCompetition(competitionId);
  if (!comp) throw new Error(`Unknown competition "${competitionId}"`);
  const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
  return table.standings.map((row) => bsdRowToStats(slugify(row.team), row));
}
