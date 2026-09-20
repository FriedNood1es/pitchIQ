import { bsd } from "../clients/bsdClient";
import { getCompetition } from "./competitions";
import { TeamSummary } from "../types";

/**
 * The team directory is the single source of truth for "which teams exist".
 * Identity is a slug derived from the team name, so it is stable across BSD
 * standings rows and fixture lists. The retrieval layer resolves the same
 * slugs back to provider rows, so no hardcoded id catalog is needed — the
 * former teamCatalog.ts is gone.
 */

/**
 * Turn a display name into a URL/id-safe slug: "Man. City" -> "man-city",
 * "Atlético Madrid" -> "atletico-madrid". Diacritics are folded to ASCII so
 * non-English league names produce clean slugs.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Primary brand colours for the current Premier League clubs, keyed by slug.
// Used only for presentation (crest accent); unknown teams fall back to a
// neutral slate so the app never breaks on an unmapped club.
const CREST_COLORS: Record<string, string> = {
  arsenal: "#EF0107",
  "aston-villa": "#95BFE5",
  bournemouth: "#DA291C",
  brentford: "#E30613",
  "brighton-and-hove-albion": "#0057B8",
  brighton: "#0057B8",
  burnley: "#6C1D45",
  chelsea: "#034694",
  "crystal-palace": "#1B458F",
  everton: "#003399",
  fulham: "#000000",
  leeds: "#FFCD00",
  "leeds-united": "#FFCD00",
  liverpool: "#C8102E",
  "liverpool-fc": "#C8102E",
  "manchester-city": "#6CABDD",
  "manchester-united": "#DA291C",
  "newcastle-united": "#241F20",
  newcastle: "#241F20",
  "nottingham-forest": "#DD0000",
  sunderland: "#EB172B",
  tottenham: "#132257",
  "tottenham-hotspur": "#132257",
  "west-ham-united": "#7A263A",
  "west-ham": "#7A263A",
  wolverhampton: "#FDB913",
  "wolverhampton-wanderers": "#FDB913",
  wolves: "#FDB913",
  // Beyond the PL: dark/saturated brand colours only, so white initials stay
  // legible. Light-clad clubs (Dortmund yellow, Napoli azure, …) deliberately
  // keep the slate fallback — a wrong-contrast badge is worse than grey.
  barcelona: "#A50044",
  "fc-barcelona": "#A50044",
  "real-madrid": "#00529F",
  "atletico-madrid": "#CB3524",
  "athletic-club": "#EE2523",
  "real-sociedad": "#0067B1",
  bayern: "#DC052D",
  "bayern-munich": "#DC052D",
  leverkusen: "#E32221",
  "bayer-leverkusen": "#E32221",
  leipzig: "#DD0741",
  "rb-leipzig": "#DD0741",
  stuttgart: "#E32219",
  "vfb-stuttgart": "#E32219",
  inter: "#0068A8",
  internazionale: "#0068A8",
  "ac-milan": "#C00000",
  milan: "#C00000",
  juventus: "#000000",
  roma: "#8E1F2F",
  "as-roma": "#8E1F2F",
  atalanta: "#1E71B8",
  lazio: "#0B4EA2",
  psg: "#004170",
  "paris-saint-germain": "#004170",
  monaco: "#E63312",
  "as-monaco": "#E63312",
  marseille: "#005A9C",
  lyon: "#DA291C",
  "olympique-lyonnais": "#DA291C",
  ajax: "#D2122E",
  "afc-ajax": "#D2122E",
  psv: "#ED1C24",
  feyenoord: "#CC0000",
  "feyenoord-rotterdam": "#CC0000",
  porto: "#003DA5",
  "fc-porto": "#003DA5",
  benfica: "#E30613",
  "sl-benfica": "#E30613",
  sporting: "#008057",
  "sporting-cp": "#008057",
  celtic: "#018749",
  rangers: "#002D72",
};

const FALLBACK_CREST_COLOR = "#475569"; // slate-600

export function crestColorFor(name: string): string {
  return CREST_COLORS[slugify(name)] ?? FALLBACK_CREST_COLOR;
}

function toSummary(name: string): TeamSummary {
  return { id: slugify(name), name, crestColor: crestColorFor(name) };
}

/** Teams available for comparison in a given competition. */
export async function listTeams(competitionId: string): Promise<TeamSummary[]> {
  const comp = getCompetition(competitionId);
  if (!comp) throw new Error(`Unknown competition "${competitionId}"`);

  const table = await bsd.standings(comp.bsdLeague, comp.bsdSeason);
  const names = table.standings.map((r) => r.team);

  return names.map((name) => toSummary(name)).sort((a, b) => a.name.localeCompare(b.name));
}
