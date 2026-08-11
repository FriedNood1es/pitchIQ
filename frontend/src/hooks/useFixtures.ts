import { useQuery } from "@tanstack/react-query";
import { fetchFixtures } from "../api/client";
import { Fixture, FixturesStatus } from "../types";

/**
 * Recent results / upcoming fixtures. Empty `competition` = all leagues.
 * Stale data is shown while refetching so the landing stays responsive.
 */
export function useFixtures(competition: string, status: FixturesStatus, enabled = true) {
  return useQuery({
    queryKey: ["fixtures", competition, status],
    queryFn: () => fetchFixtures(competition, status),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
