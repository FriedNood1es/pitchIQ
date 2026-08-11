import { useQuery } from "@tanstack/react-query";
import { fetchTeamStats } from "../api/client";

/** Season stats for one team, matched by display name against standings. */
export function useTeamStats(competition: string, name: string) {
  return useQuery({
    queryKey: ["team-stats", competition, name],
    queryFn: () => fetchTeamStats(competition, name),
    enabled: Boolean(competition) && Boolean(name),
    staleTime: 1000 * 60 * 10,
  });
}
