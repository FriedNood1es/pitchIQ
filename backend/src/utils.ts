/** Shared backend helpers — one copy instead of one per agent. */

export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** BSD player positions are single letters (G/D/M/F); expand to a group label. */
const POSITION_GROUP: Record<string, string> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

export function positionGroup(position?: string): string {
  return POSITION_GROUP[position ?? ""] ?? position ?? "Unknown";
}
