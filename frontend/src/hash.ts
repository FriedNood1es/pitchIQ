import { FixturesStatus, TeamId } from "./types";

export type ViewMode = "fixtures" | "compare" | "team";

interface FixturesSelection {
  mode: "fixtures";
  /** Empty string = all leagues. */
  competition: string;
  status: FixturesStatus;
}

interface CompareSelection {
  mode: "compare";
  competition: string;
  teamA: TeamId;
  teamB: TeamId;
}

interface TeamSelection {
  mode: "team";
  competition: string;
  /** Preview slug (matches the fixtures/preview endpoints). */
  team: TeamId;
}

export type HashSelection = FixturesSelection | CompareSelection | TeamSelection;

const STATUSES: FixturesStatus[] = ["all", "finished", "scheduled", "live"];

/**
 * The current view lives in the URL hash so it can be shared and restored on
 * refresh / back-forward navigation:
 *   #/fixtures[/<competition>][/<status>]      (competition "all" = every league)
 *   #/compare/<competition>/<teamA>/<teamB>
 *   #/team/<competition>/<team>
 * Returns null when the hash isn't a valid shape.
 */
export function parseHash(): HashSelection | null {
  const fixtures = location.hash.match(/^#\/fixtures(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (fixtures) {
    const seg1 = fixtures[1] ?? "";
    const seg2 = fixtures[2] ?? "";
    const status: FixturesStatus = STATUSES.includes(seg2 as FixturesStatus)
      ? (seg2 as FixturesStatus)
      : "all";
    const competition = seg1 && seg1 !== "all" ? seg1 : "";
    return { mode: "fixtures", competition, status };
  }

  const compare = location.hash.match(/^#\/compare\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (compare) {
    return {
      mode: "compare",
      competition: compare[1],
      teamA: compare[2],
      teamB: compare[3],
    };
  }

  const team = location.hash.match(/^#\/team\/([^/]+)\/([^/]+)$/);
  if (team) {
    return {
      mode: "team",
      competition: team[1],
      team: team[2],
    };
  }
  return null;
}

export function writeHash(selection: HashSelection): void {
  const next =
    selection.mode === "fixtures"
      ? `#/fixtures/${selection.competition || "all"}/${selection.status}`
      : selection.mode === "compare"
        ? `#/compare/${selection.competition}/${selection.teamA}/${selection.teamB}`
        : `#/team/${selection.competition}/${selection.team}`;
  if (location.hash !== next) location.hash = next;
}
