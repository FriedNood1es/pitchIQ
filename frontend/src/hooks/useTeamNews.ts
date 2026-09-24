import { useQuery } from "@tanstack/react-query";
import { fetchTeamNews } from "../api/client";

/** Social-feed news for one team (team dashboard) — empty feed, not an error. */
export function useTeamNews(competition: string, name: string) {
  return useQuery({
    queryKey: ["team-news", competition, name],
    queryFn: () => fetchTeamNews(competition, name),
    enabled: Boolean(competition) && Boolean(name),
    staleTime: 1000 * 60 * 10,
  });
}
