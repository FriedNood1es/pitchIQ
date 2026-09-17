/**
 * Club badges from ESPN's keyless scoreboard API (BSD exposes no artwork).
 * Slugs are doc-confirmed (Public-ESPN-API soccer table), including
 * `uefa.europa.conf` for the Conference League. Plain fetch: browsers can't
 * call ESPN (no CORS headers) and some networks refuse its DNS, so this runs
 * server-side behind GET /api/crests with a 24h cache — monograms cover
 * every failure, and only successful fills are cached.
 */

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
  // Verified CDN pattern keys off the lowercase abbreviation (e.g. dal);
  // the numeric-id pattern also serves. Either beats a monogram.
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

export async function espnCrests(competitionId: string): Promise<EspnCrest[]> {
  const slug = ESPN_SLUG[competitionId];
  if (!slug) return [];
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.teams;
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const teams = parseTeams(await res.json());
    // Never cache empties — an outage shouldn't poison a day.
    if (teams.length > 0) cache.set(slug, { at: Date.now(), teams });
    return teams;
  } catch (err) {
    console.warn(
      `[espnClient] crests unavailable for ${slug}: ${(err as Error).message}`
    );
    return [];
  }
}
