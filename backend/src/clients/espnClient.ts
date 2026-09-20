/**
 * Club badges from ESPN's keyless scoreboard API (BSD exposes no artwork).
 *
 * Primary source: data/espn-crests.json (generated snapshot, committed).
 * The live API is an optional refresh — on unblocked networks it populates
 * the in-memory cache; on blocked networks the JSON provides badges instantly.
 *
 * Generation: node scripts/fetch-espn-crests.mjs (from any machine with
 * ESPN access). Run once at season start or when squads change.
 *
 * CDN pattern: https://a.espncdn.com/i/teamlogos/soccer/500/{id}.png
 * The CDN is always reachable even when the ESPN API is firewalled.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

export interface EspnCrest {
  id: string;
  name: string;
  url: string;
}

/** Our competition id -> ESPN league slug (doc-confirmed). */
const ESPN_SLUG: Record<string, string> = {
  "premier-league": "eng.1",
  "la-liga": "esp.1",
  "serie-a": "ita.1",
  bundesliga: "ger.1",
  "ligue-1": "fra.1",
  "champions-league": "uefa.champions",
  "europa-league": "uefa.europa",
  "conference-league": "uefa.europa.conf",
  eredivisie: "ned.1",
  "liga-portugal": "por.1",
  championship: "eng.2",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const cache = new Map<string, { at: number; teams: EspnCrest[] }>();

// --- Static JSON fallback (primary source on blocked networks) ---

interface StaticCrestData {
  generatedAt: string;
  teams: Record<string, EspnCrest[]>;
}

let staticCrests: StaticCrestData | null = null;

function loadStaticCrests(): StaticCrestData {
  if (staticCrests) return staticCrests;
  try {
    // dist/clients/espnClient.js -> ../../data/espn-crests.json
    const path = resolve(__dirname, "../../data/espn-crests.json");
    staticCrests = JSON.parse(readFileSync(path, "utf-8"));
    console.log(
      `[espnClient] loaded static crests (${staticCrests!.generatedAt})`
    );
  } catch {
    console.warn("[espnClient] no static crest file found — crests will depend on live API");
    staticCrests = { generatedAt: "", teams: {} };
  }
  return staticCrests!;
}

// --- ESPN API (live refresh) ---

/** Prefer the default artwork variant, else the first logo, else CDN patterns. */
function pickUrl(t: {
  id?: unknown;
  abbreviation?: unknown;
  logos?: unknown;
}): string | undefined {
  const logos = Array.isArray(t.logos) ? t.logos : [];
  const isHref = (l: unknown): l is { href: string } =>
    !!l && typeof (l as { href?: unknown }).href === "string";
  const hasRel = (l: unknown, rel: string) =>
    Array.isArray((l as { rel?: unknown }).rel) &&
    (l as { rel: string[] }).rel.includes(rel);
  const pick =
    logos.find((l) => hasRel(l, "default") && isHref(l)) ??
    logos.find((l) => hasRel(l, "full") && isHref(l)) ??
    logos.find(isHref);
  if (pick) return pick.href;
  if (typeof t.abbreviation === "string" && t.abbreviation) {
    return `https://a.espncdn.com/i/teamlogos/soccer/500/${t.abbreviation.toLowerCase()}.png`;
  }
  if (t.id != null) {
    return `https://a.espncdn.com/i/teamlogos/soccer/500/${t.id}.png`;
  }
  return undefined;
}

/** Defensive parse — ESPN is unofficial and its shape may drift. */
function parseTeams(json: unknown): EspnCrest[] {
  const entries =
    (json as { sports?: { leagues?: { teams?: unknown[] }[] }[] })?.sports?.[0]
      ?.leagues?.[0]?.teams ?? [];
  const out: EspnCrest[] = [];
  for (const e of entries) {
    const t = (
      e as {
        team?: {
          id?: unknown;
          displayName?: unknown;
          abbreviation?: unknown;
        } & Record<string, unknown>;
      }
    )?.team;
    if (!t || typeof t.displayName !== "string") continue;
    const url = pickUrl(t);
    if (!url) continue;
    out.push({ id: String(t.id ?? t.displayName), name: t.displayName, url });
  }
  return out;
}

async function fetchLiveCrests(slug: string): Promise<EspnCrest[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return parseTeams(await res.json());
}

// --- Public API ---

export function espnCrests(competitionId: string): EspnCrest[] {
  const slug = ESPN_SLUG[competitionId];
  if (!slug) return [];

  // 1. In-memory cache (24h)
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.teams;

  // 2. Live API (non-blocking — fire and forget to refresh cache)
  fetchLiveCrests(slug)
    .then((teams) => {
      if (teams.length > 0) cache.set(slug, { at: Date.now(), teams });
    })
    .catch(() => {
      /* blocked network — silent, static fallback covers us */
    });

  // 3. Static JSON (synchronous, immediate)
  const staticData = loadStaticCrests();
  const fromJson = (staticData.teams[competitionId] ?? []).map((t) => ({
    ...t,
    // Ensure URL uses CDN pattern even if JSON entry is missing it
    url: t.url || `https://a.espncdn.com/i/teamlogos/soccer/500/${t.id}.png`,
  }));

  // Cache the static result too so subsequent calls within TTL skip the load
  if (fromJson.length > 0 && !hit) {
    cache.set(slug, { at: Date.now(), teams: fromJson });
  }

  return fromJson;
}
