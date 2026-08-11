/**
 * Supported competitions. Each maps to a BSD league id + a specific season.
 *
 * The season pinned here is the most recent COMPLETED campaign (2025/26),
 * because BSD's live "current" season (26/27) has no table yet and the
 * completed one carries full expected-goals (xG) data. All eleven were
 * verified to return a populated standings table with xG on every row.
 *
 * To refresh to a newer season, list a league's seasons via
 *   GET /seasons/?league=<bsdLeague>
 * find the entry whose name contains the target campaign (e.g. "26/27"), and
 * swap its id in below. (BSD's numeric `year` field is unreliable — match on
 * the season name.)
 */
export interface Competition {
  id: string; // slug used in the API + UI
  name: string;
  country: string;
  bsdLeague: number;
  bsdSeason: number;
}

export const COMPETITIONS: Competition[] = [
  { id: "premier-league", name: "Premier League", country: "England", bsdLeague: 1, bsdSeason: 337 },
  { id: "la-liga", name: "La Liga", country: "Spain", bsdLeague: 3, bsdSeason: 294 },
  { id: "serie-a", name: "Serie A", country: "Italy", bsdLeague: 4, bsdSeason: 358 },
  { id: "bundesliga", name: "Bundesliga", country: "Germany", bsdLeague: 5, bsdSeason: 228 },
  { id: "ligue-1", name: "Ligue 1", country: "France", bsdLeague: 6, bsdSeason: 317 },
  { id: "champions-league", name: "Champions League", country: "Europe", bsdLeague: 7, bsdSeason: 268 },
  { id: "europa-league", name: "Europa League", country: "Europe", bsdLeague: 8, bsdSeason: 280 },
  { id: "conference-league", name: "Conference League", country: "Europe", bsdLeague: 83, bsdSeason: 1607 },
  { id: "eredivisie", name: "Eredivisie", country: "Netherlands", bsdLeague: 10, bsdSeason: 279 },
  { id: "liga-portugal", name: "Liga Portugal", country: "Portugal", bsdLeague: 2, bsdSeason: 305 },
  { id: "championship", name: "Championship", country: "England", bsdLeague: 12, bsdSeason: 243 },
];

export const DEFAULT_COMPETITION_ID = "premier-league";

export function getCompetition(id: string): Competition | undefined {
  return COMPETITIONS.find((c) => c.id === id);
}
