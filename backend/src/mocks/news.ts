import { NewsItem, TeamId } from "../types";

const newsByTeam: Record<string, NewsItem[]> = {
  arsenal: [
    {
      teamId: "arsenal",
      headline: "Arsenal close in on title race after dominant win",
      summary: "The Gunners extended their unbeaten run to eight matches with a commanding performance.",
      publishedAt: "2026-07-05",
    },
    {
      teamId: "arsenal",
      headline: "Gabriel a doubt for Chelsea clash",
      summary: "Manager confirms the defender is being assessed ahead of the weekend fixture.",
      publishedAt: "2026-07-06",
    },
  ],
  chelsea: [
    {
      teamId: "chelsea",
      headline: "Chelsea boosted by return of key midfielder",
      summary: "A midfield regular returns to full training after a spell on the sidelines.",
      publishedAt: "2026-07-04",
    },
    {
      teamId: "chelsea",
      headline: "James and Lavia set to miss Arsenal trip",
      summary: "Two first-team regulars remain unavailable for the upcoming away fixture.",
      publishedAt: "2026-07-06",
    },
  ],
};

export function getTeamNews(teamId: TeamId): NewsItem[] {
  return newsByTeam[teamId] ?? [];
}
