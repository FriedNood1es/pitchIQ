import { useQuery } from "@tanstack/react-query";
import { fetchSearch } from "../api/client";

/**
 * Global team search. Takes the already-debounced input; fires once the query
 * is at least 2 characters. `placeholderData` keeps the previous result list
 * while typing so the dropdown doesn't flicker.
 */
export function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => fetchSearch(q),
    enabled: q.length >= 2,
    staleTime: 1000 * 60 * 10, // backend index is cached anyway
    placeholderData: (prev) => prev,
  });
}
