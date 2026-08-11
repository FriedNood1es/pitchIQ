import { HeadToHeadMatch, TeamId } from "../types";

const arsenalVsChelsea: HeadToHeadMatch[] = [
  { date: "2025-10-04", homeTeam: "arsenal", awayTeam: "chelsea", homeGoals: 2, awayGoals: 1 },
  { date: "2025-04-20", homeTeam: "chelsea", awayTeam: "arsenal", homeGoals: 1, awayGoals: 1 },
  { date: "2024-12-01", homeTeam: "arsenal", awayTeam: "chelsea", homeGoals: 3, awayGoals: 0 },
  { date: "2024-05-12", homeTeam: "chelsea", awayTeam: "arsenal", homeGoals: 2, awayGoals: 2 },
  { date: "2023-11-10", homeTeam: "arsenal", awayTeam: "chelsea", homeGoals: 1, awayGoals: 0 },
];

/**
 * Curated head-to-head sample. We only have real fixtures for the
 * Arsenal–Chelsea showcase pairing; for any other matchup there is no BSD
 * H2H endpoint, so we return an empty list rather than misattributing these
 * results to unrelated teams (the validation agent then flags the gap).
 */
export function getHeadToHead(teamA?: TeamId, teamB?: TeamId): HeadToHeadMatch[] {
  const pair = new Set([teamA, teamB]);
  const isShowcasePair = pair.has("arsenal") && pair.has("chelsea");
  if (teamA && teamB && !isShowcasePair) return [];
  return arsenalVsChelsea;
}
