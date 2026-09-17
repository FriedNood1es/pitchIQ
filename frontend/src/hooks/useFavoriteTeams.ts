import { useState } from "react";
import { TeamSearchResult } from "../types";

const KEY = "pitchiq:favorite-teams";

function load(): TeamSearchResult[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((x) => x && typeof x.id === "string" && typeof x.competition === "string")
      : [];
  } catch {
    return [];
  }
}

const keyOf = (competition: string, id: string) => `${competition}/${id}`;

/** Starred teams across competitions, persisted. Keyed by competition + id. */
export function useFavoriteTeams(): [
  TeamSearchResult[],
  (team: TeamSearchResult) => void,
  (competition: string, id: string) => boolean,
] {
  const [favorites, setFavorites] = useState<TeamSearchResult[]>(load);
  function toggle(team: TeamSearchResult) {
    setFavorites((prev) => {
      const key = keyOf(team.competition, team.id);
      const next = prev.some((f) => keyOf(f.competition, f.id) === key)
        ? prev.filter((f) => keyOf(f.competition, f.id) !== key)
        : [...prev, team];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Private mode etc. — favorites just don't persist.
      }
      return next;
    });
  }
  function isFavorite(competition: string, id: string) {
    return favorites.some((f) => keyOf(f.competition, f.id) === keyOf(competition, id));
  }
  return [favorites, toggle, isFavorite];
}
