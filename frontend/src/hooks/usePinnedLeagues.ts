import { useState } from "react";

const KEY = "pitchiq:pinned-leagues";

function load(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Competition ids pinned to the sidebar top, persisted across visits. */
export function usePinnedLeagues(): [string[], (id: string) => void] {
  const [pinned, setPinned] = useState<string[]>(load);
  function toggle(id: string) {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Private mode etc. — pinning just doesn't persist.
      }
      return next;
    });
  }
  return [pinned, toggle];
}
