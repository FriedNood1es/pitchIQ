import { useQuery } from "@tanstack/react-query";
import { fetchTeams } from "../api/client";

export function useTeams(competition: string) {
  return useQuery({
    queryKey: ["teams", competition],
    queryFn: () => fetchTeams(competition),
    enabled: Boolean(competition),
    staleTime: 1000 * 60 * 10, // team list rarely changes within a session
  });
}
