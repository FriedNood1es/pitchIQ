import { useQuery } from "@tanstack/react-query";
import { fetchPreview, fetchPreviewTeams } from "../api/client";
import { TeamId } from "../types";

/** Teams with an upcoming fixture in a competition (preview picker). */
export function usePreviewTeams(competition: string) {
  return useQuery({
    queryKey: ["preview-teams", competition],
    queryFn: () => fetchPreviewTeams(competition),
    enabled: Boolean(competition),
  });
}

/** Predicted lineups for a team's next fixture. */
export function usePreview(competition: string, team: TeamId, enabled: boolean) {
  return useQuery({
    queryKey: ["preview", competition, team],
    queryFn: () => fetchPreview(competition, team),
    enabled: enabled && Boolean(competition) && Boolean(team),
  });
}
