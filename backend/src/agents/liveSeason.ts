import { bsd } from "../clients/bsdClient";
import { Competition } from "../data/competitions";

/**
 * The live (in-progress) BSD season id for a competition. Fixtures — both
 * upcoming and recently finished — only exist on this season; the completed
 * seasons pinned in `data/competitions.ts` (used for standings/compare) carry
 * no fixtures. Shared by the preview and fixtures agents.
 */
export async function getLiveSeasonId(comp: Competition): Promise<number> {
  const league = await bsd.currentSeason(comp.bsdLeague);
  const live = league.current_season?.id;
  if (!live) {
    throw new Error(`No live season found for ${comp.name}`);
  }
  return live;
}
