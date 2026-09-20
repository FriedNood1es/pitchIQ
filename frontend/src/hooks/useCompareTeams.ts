import { useQuery } from "@tanstack/react-query";
import { fetchComparison } from "../api/client";
import { TeamId } from "../types";

export function useCompareTeams(
  competition: string,
  teamA: TeamId,
  teamB: TeamId,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["compare", competition, teamA, teamB],
    queryFn: () => fetchComparison(competition, teamA, teamB),
    enabled,
    // Pairing data is effectively static (pinned season); the backend also
    // caches the LLM insight, so this just avoids refetch on tab switches.
    staleTime: 1000 * 60 * 10,
  });
}
