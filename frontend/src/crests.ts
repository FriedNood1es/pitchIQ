import { useEffect, useState } from "react";

/**
 * Club badges via the backend crest proxy (`GET /api/crests?competition=`).
 * The browser never touches provider APIs directly; this module only matches
 * BSD names to badge URLs. Every failure path yields no crest and the caller
 * keeps its monogram — a wrong badge is worse than none.
 */

export interface EspnTeam {
  id: string;
  name: string;
  url: string;
}

/** Our eleven competition ids (mirrors the backend catalog). */
const COMPETITIONS = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "champions-league",
  "europa-league",
  "conference-league",
  "eredivisie",
  "liga-portugal",
  "championship",
];

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// v2: v1 entries may hold empties cached during the direct-fetch era.
const cacheKey = (competition: string) => `pitchiq:espn-teams:v2:${competition}`;

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isTeam(t: unknown): t is EspnTeam {
  const o = t as Record<string, unknown>;
  return !!o && typeof o.id === "string" && typeof o.name === "string" && typeof o.url === "string";
}

const mem = new Map<string, EspnTeam[]>();
const inflight = new Map<string, Promise<EspnTeam[]>>();

async function loadLeague(competition: string): Promise<EspnTeam[]> {
  const hit = mem.get(competition);
  if (hit) return hit;
  try {
    const raw = localStorage.getItem(cacheKey(competition));
    if (raw) {
      const parsed = JSON.parse(raw) as { at: number; teams: unknown };
      if (
        Array.isArray(parsed.teams) &&
        parsed.teams.length > 0 &&
        parsed.teams.every(isTeam) &&
        Date.now() - parsed.at < CACHE_TTL_MS
      ) {
        mem.set(competition, parsed.teams);
        return parsed.teams;
      }
    }
  } catch {
    // Corrupt cache or private mode — fall through to network.
  }
  let p = inflight.get(competition);
  if (!p) {
    p = fetch(`/api/crests?competition=${encodeURIComponent(competition)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`crests ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        const teams = Array.isArray(json) ? json.filter(isTeam) : [];
        // Never cache empties — a transient ESPN outage shouldn't poison a week.
        if (teams.length > 0) {
          mem.set(competition, teams);
          try {
            localStorage.setItem(
              cacheKey(competition),
              JSON.stringify({ at: Date.now(), teams })
            );
          } catch {
            // Private mode — memory cache still covers the session.
          }
        }
        return teams;
      })
      .catch(() => [] as EspnTeam[])
      .finally(() => {
        inflight.delete(competition);
      });
    inflight.set(competition, p);
  }
  return p;
}

/**
 * BSD display name -> badge URL. Exact, then normalized equality, then
 * unique one-directional token containment ("Newcastle" ⊂ "Newcastle
 * United" — never the reverse, which would match unrelated clubs sharing a
 * word). Anything ambiguous returns undefined: monogram, not a wrong badge.
 */
export function findCrestURL(teams: EspnTeam[], name: string): string | undefined {
  const norm = tokens(name).join(" ");
  const exact = teams.find((t) => tokens(t.name).join(" ") === norm);
  if (exact) return exact.url;
  const want = tokens(name);
  const cands = teams.filter((t) => {
    const have = new Set(tokens(t.name));
    return want.length > 0 && want.every((w) => have.has(w));
  });
  if (cands.length === 1) return cands[0].url;
  return undefined;
}

/**
 * Badge teams for one competition, or all eleven when competition is "".
 * Null while loading; empty when unresolvable — both mean monograms.
 */
export function useEspnTeams(competition: string): EspnTeam[] | null {
  const [teams, setTeams] = useState<EspnTeam[] | null>(null);
  useEffect(() => {
    let live = true;
    const ids = competition ? [competition] : COMPETITIONS;
    Promise.all(ids.map(loadLeague)).then((lists) => {
      if (!live) return;
      // Cross-league merges duplicate clubs (Arsenal domestic + cups) —
      // dedupe by normalized name so containment stays unique.
      const seen = new Set<string>();
      const merged: EspnTeam[] = [];
      for (const t of lists.flat()) {
        const key = tokens(t.name).join(" ");
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(t);
      }
      setTeams(merged);
    });
    return () => {
      live = false;
    };
  }, [competition]);
  return teams;
}
