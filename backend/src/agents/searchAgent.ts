import { COMPETITIONS } from "../data/competitions";
import { TeamSummary } from "../types";
import { listPreviewTeams, PreviewTeam } from "./previewAgent";

/** A team in the global search index, tagged with its competition. */
export interface TeamSearchResult extends TeamSummary {
  competition: string;
  competitionName: string;
  country: string;
}

const MAX_RESULTS = 8;

interface ScoredResult extends TeamSearchResult {
  score: number;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Case-insensitive team search across every supported competition. The index
 * is the union of each league's preview-teams list (live-season fixtures, so
 * promoted clubs are included and ids match the preview/fixtures endpoints).
 * Each competition list is cached ~1h and pre-built at boot
 * (`warmSearchIndex`), so the first query after startup is already warm.
 *
 * Results are ranked exact name > prefix > substring, then alphabetically.
 */
export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const lists: ScoredResult[][] = await Promise.all(
    COMPETITIONS.map(async (comp) => {
      let teams: PreviewTeam[];
      try {
        teams = await listPreviewTeams(comp.id);
      } catch (err) {
        console.warn(`[search] skipping ${comp.id}: ${errMsg(err)}`);
        return [] as ScoredResult[];
      }
      return teams
        .filter((t) => t.name.toLowerCase().includes(q))
        .map((t): ScoredResult => {
          let score = 1; // substring
          if (t.name.toLowerCase() === q) score = 3; // exact
          else if (t.name.toLowerCase().startsWith(q)) score = 2; // prefix
          return {
            id: t.id,
            name: t.name,
            crestColor: t.crestColor,
            competition: comp.id,
            competitionName: comp.name,
            country: comp.country,
            score,
          };
        });
    })
  );

  return lists
    .flat()
    .sort(
      (a, b) =>
        b.score - a.score ||
        // Prefer a team's domestic league over its European-cup entries: the
        // pinned (completed) season always has domestic standings, so stats
        // resolve for the higher-ranked hit.
        (a.country === "Europe" ? 1 : 0) - (b.country === "Europe" ? 1 : 0) ||
        a.competitionName.localeCompare(b.competitionName) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, MAX_RESULTS)
    .map(({ score, ...rest }) => rest);
}
