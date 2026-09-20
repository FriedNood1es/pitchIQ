import { bsd, BsdSocialItem } from "../clients/bsdClient";
import { getCompetition } from "../data/competitions";
import { slugify } from "../data/teamDirectory";
import { Intent, NewsItem, NewsResult, TeamId } from "../types";

/**
 * News comes from the BSD team `social` feed — a mix of press coverage and the
 * club's own tweets. BSD has no dedicated news endpoint, so this is the real
 * source. Any failure degrades to empty lists rather than failing the whole
 * comparison, since news is supporting colour, not core analysis.
 */

const MAX_ITEMS_PER_TEAM = 6;

export async function runNewsAgent(intent: Intent): Promise<NewsResult> {
  return (await retrieveBsdNews(intent)) ?? { teamA: [], teamB: [] };
}

/** Returns null when the feed can't be resolved, signalling empty lists. */
async function retrieveBsdNews(intent: Intent): Promise<NewsResult | null> {
  const comp = getCompetition(intent.competition);
  if (!comp) return null;

  try {
    // Standings resolves slug -> BSD numeric team id. The data retrieval agent
    // has already fetched this for the same request, so it's a cache hit.
    const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
    const idBySlug = new Map(
      table.standings.map((r) => [slugify(r.team), r.team_id])
    );

    const idA = idBySlug.get(intent.teamA);
    const idB = idBySlug.get(intent.teamB);
    if (idA === undefined || idB === undefined) return null;

    const [teamA, teamB] = await Promise.all([bsd.team(idA), bsd.team(idB)]);
    return {
      teamA: toNewsItems(intent.teamA, teamA.social),
      teamB: toNewsItems(intent.teamB, teamB.social),
    };
  } catch (err) {
    console.warn(
      "[newsAgent] BSD social feed unavailable, returning empty news:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

function toNewsItems(
  teamId: TeamId,
  social: BsdSocialItem[] | null
): NewsItem[] {
  const seen = new Set<string>();

  return (social ?? [])
    .filter(isEditorial)
    .map((item) => toNewsItem(teamId, item))
    .filter((item): item is NewsItem => item !== null)
    .filter((item) => {
      // The same story often arrives from several syndicated outlets.
      const key = item.headline.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS_PER_TEAM);
}

/**
 * The feed is keyword-matched against the club name, so it picks up two kinds
 * of non-editorial noise that crowd out real stories:
 *  - auto-generated sportsbook listings ("Aston Villa v Arsenal Odds"), and
 *  - SEO/product spam that merely contains the club name ("Mj Arsenal
 *    Accessories ... 25932906 Stock Photo At Vecteezy").
 * The listing IDs in the latter are the reliable tell — real headlines don't
 * carry bare 5+ digit numbers.
 */
function isEditorial(item: BsdSocialItem): boolean {
  if (/sportsbook|betting|bookmaker/i.test(item.account_handle ?? "")) {
    return false;
  }
  if (item.type !== "news") return true;

  const title = item.title ?? "";
  if (/\bodds\b/i.test(title)) return false;
  return !/\b\d{5,}\b/.test(title);
}

function toNewsItem(teamId: TeamId, item: BsdSocialItem): NewsItem | null {
  const isTweet = item.type === "tweet";
  // News items put their content in `title`; tweets put it in `text`.
  const headline = (isTweet ? item.text : item.title)?.trim();
  if (!headline) return null;

  return {
    teamId,
    headline,
    summary: isTweet ? "" : (item.text ?? "").trim(),
    publishedAt: item.published_at,
    source: item.account_name || item.account_handle,
    url: item.url,
    kind: isTweet ? "tweet" : "news",
    // Pass through only when present — tweets carry none, and an empty
    // string must not render a broken frame downstream.
    ...(item.thumbnail?.trim() ? { thumbnail: item.thumbnail.trim() } : {}),
  };
}
