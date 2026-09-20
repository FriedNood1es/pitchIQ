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
// v3: v2 entries predate the full 264-team snapshot regen (Leeds et al.
// missing from the old 10-team PL seed). Bump the version on every snapshot
// regen, or stale league lists linger up to CACHE_TTL_MS.
const cacheKey = (competition: string) => `pitchiq:espn-teams:v3:${competition}`;

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    // ø/ł have no NFD decomposition — without this they strip entirely
    // ("Bodø/Glimt" → "bod glimt" instead of "bodo glimt").
    .replace(/ø/g, "o")
    .replace(/Ø/g, "O")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
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
 * BSD display name -> badge URL. Exact (after aliasing), then normalized
 * equality, then unique token containment either way ("Newcastle" ⊂
 * "Newcastle United" forward; "FC Barcelona" ⊃ "Barcelona" reverse, since
 * BSD adds affixes ESPN drops). An ambiguous reverse match prefers the
 * candidate whose extra BSD tokens are all generic club-type affixes
 * ("Deportivo Alavés" → "Alavés", not "Deportivo"). Anything still
 * ambiguous returns undefined: monogram, not a wrong badge.
 *
 * Keys/values are normalized token strings (see tokens()).
 */
const ALIAS: Record<string, string> = {
  "real racing club": "racing santander",
  "fc bayern munchen": "bayern munich",
  "1 fc koln": "fc cologne",
  "borussia m gladbach": "borussia monchengladbach",
  "hamburger sv": "hamburg sv",
  inter: "internazionale",
  "olympique lyonnais": "lyon",
  "stade brestois": "brest",
  "sk slavia praha": "slavia prague",
  "afc ajax": "ajax amsterdam",
  "fc kobenhavn": "f c kobenhavn",
  "cd nacional": "c d nacional",
  "vitoria sc": "vitoria de guimaraes",
  "red bull salzburg": "rb salzburg",
};

/** Generic affixes that carry no identity ("FC", "Real", "UD", ...). */
const AFFIX = new Set([
  "1", "f", "c", "d", "fc", "cf", "ac", "as", "sc", "rc", "sv", "ud", "cd",
  "ss", "ssc", "sk", "afc", "real", "deportivo", "de", "st", "vfb", "vfl",
  "tsg", "psv", "rb", "aj",
]);

export function findCrestURL(teams: EspnTeam[], name: string): string | undefined {
  const norm = tokens(name).join(" ");
  const want = tokens(ALIAS[norm] ?? name);
  const wantNorm = want.join(" ");
  const exact = teams.find((t) => tokens(t.name).join(" ") === wantNorm);
  if (exact) return exact.url;
  // Forward: BSD name is a subset of the ESPN name ("Newcastle" ⊂ "Newcastle United").
  const fwd = teams.filter((t) => {
    const have = new Set(tokens(t.name));
    return want.length > 0 && want.every((w) => have.has(w));
  });
  if (fwd.length === 1) return fwd[0].url;
  // Reverse: ESPN name is a subset of the BSD name — BSD adds affixes ESPN
  // drops ("FC Barcelona" ⊃ "Barcelona"). Same uniqueness guard applies.
  const wantSet = new Set(want);
  const rev = teams.filter((t) => {
    const have = tokens(t.name);
    return have.length > 0 && have.every((w) => wantSet.has(w));
  });
  if (rev.length === 1) return rev[0].url;
  // Ambiguous reverse (e.g. "Deportivo Alavés" matches both "Alavés" and
  // "Deportivo"): keep candidates whose extra BSD tokens are all affixes.
  if (rev.length > 1) {
    const specific = rev.filter((t) => {
      const have = new Set(tokens(t.name));
      const extra = want.filter((w) => !have.has(w));
      return extra.length > 0 && extra.every((w) => AFFIX.has(w));
    });
    if (specific.length === 1) return specific[0].url;
  }
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
