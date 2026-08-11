import { useQuery } from "@tanstack/react-query";
import { fetchCompetitions } from "../api/client";

export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    queryFn: fetchCompetitions,
    staleTime: Infinity, // static list for the session
  });
}
