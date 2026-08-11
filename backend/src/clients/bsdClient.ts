import { config } from "../config";

/**
 * Client for BSD (sports.bzzoiro.com). Auth is a token sent as
 * `Authorization: Token <key>`. The football tier has no rate limit, but a
 * short in-memory cache still avoids redundant round-trips within a session.
 *
 * The standings endpoint is the workhorse: one call returns the full league
 * table for a season including points, form, and expected-goals (xG) figures.
 */

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

interface CacheEntry {
  expires: number;
  value: unknown;
}
const cache = new Map<string, CacheEntry>();

/** Abort any request that has not replied within this window. */
const REQUEST_TIMEOUT_MS = 8000;

async function get<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.value as T;
  }

  const res = await fetch(`${config.bsd.baseUrl}${path}`, {
    headers: { Authorization: `Token ${config.bsd.key}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`BSD ${path} failed: HTTP ${res.status}`);
  }

  const body = (await res.json()) as T & { error?: boolean; detail?: string };
  if (body && (body as { error?: boolean }).error) {
    throw new Error(`BSD ${path} error: ${(body as { detail?: string }).detail}`);
  }

  cache.set(path, { expires: Date.now() + CACHE_TTL_MS, value: body });
  return body as T;
}

export interface BsdStandingRow {
  position: number;
  team: string;
  team_id: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  xgf: number;
  xga: number;
  xgd: number;
  xg_games: number;
  form: string; // e.g. "WWDLW"
  live: boolean;
}

export interface BsdStandingsResponse {
  league: string;
  season: { id: number; name: string; year: number };
  standings: BsdStandingRow[];
}

/**
 * One entry in a team's `social` feed. The feed mixes two shapes: `news`
 * articles carry their content in `title` (with `text` empty), while `tweet`
 * items carry it in `text` (with `title` empty).
 */
export interface BsdSocialItem {
  id: number;
  type: "news" | "tweet" | string;
  url: string;
  title: string;
  text: string;
  thumbnail: string;
  account_handle: string;
  account_name: string;
  account_verified: boolean;
  published_at: string; // ISO 8601
}

export interface BsdTeamResponse {
  id: number;
  name: string;
  short_name: string;
  country: string;
  social: BsdSocialItem[] | null;
}

/**
 * One fixture in a list response (the summary, not the full detail object).
 * `status` is `"finished"` for played matches, `"notstarted"` for upcoming.
 */
export interface BsdFixtureTeamRef {
  id: number;
  name?: string;
}

export interface BsdFixtureSummary {
  id: number;
  event_date: string;
  status: string;
  home_team: string;
  away_team: string;
  home_team_obj?: BsdFixtureTeamRef;
  away_team_obj?: BsdFixtureTeamRef;
  home_score: number | null;
  away_score: number | null;
}

export interface BsdFixtureListResponse {
  count: number;
  next: string | null;
  results: BsdFixtureSummary[];
}

/** A player row inside a lineup side. `captain` only appears on confirmed XIs. */
export interface BsdLineupPlayer {
  id: number | null;
  name: string;
  short_name?: string;
  position: string; // G / D / M / F
  jersey_number: number | null;
  ai_score: number | null;
  captain?: boolean;
}

export interface BsdLineupSide {
  team_id: number;
  team_name: string;
  formation: string;
  confidence: number | null;
  players: BsdLineupPlayer[];
  substitutes: BsdLineupPlayer[];
}

export interface BsdUnavailablePlayer {
  name: string;
  status: string; // "injured" / "suspended" / ...
  reason: string;
  expected_return: string | null;
}

/**
 * `lineup_status` distinguishes the AI-generated XI (`predicted`) from the
 * club's official one (`confirmed`); `unavailable` means no data at all.
 */
export interface BsdV2LineupsResponse {
  event_id: number;
  lineup_status: "unavailable" | "predicted" | "confirmed";
  lineups: { home: BsdLineupSide; away: BsdLineupSide } | null;
  unavailable_players: {
    home: BsdUnavailablePlayer[];
    away: BsdUnavailablePlayer[];
  } | null;
  updated_at: string | null;
}

export interface BsdH2hMatch {
  home: string;
  away: string;
  date: string;
  score: string;
}

export interface BsdH2hResponse {
  total_matches: number;
  home_wins: number;
  draws: number;
  away_wins: number;
  home_goals: number;
  away_goals: number;
  avg_total_goals: number;
  home_win_rate: number;
  away_win_rate: number;
  recent_matches: BsdH2hMatch[];
}

/**
 * League detail. The useful field is `current_season.id`: the live campaign
 * (the pinned completed season in `data/competitions.ts` has no fixtures).
 */
export interface BsdLeagueResponse {
  id: number;
  name: string;
  country: string;
  is_women: boolean;
  current_season: { id: number; name: string; year: number };
}

/** A player in an AI-predicted lineup. `ai_score` is already 0-100 here. */
export interface BsdPredictedStarter {
  name: string;
  short_name: string;
  player_id: number;
  position: string; // G / D / M / F
  predicted_slot: string | null;
  jersey_number: number | null;
  ai_score: number;
  availability: string;
  injury_type: string;
  injury_expected_return: string | null;
}

export interface BsdPredictedSide {
  team: string;
  predicted_formation: string;
  /** 0-100 model confidence in the predicted XI. */
  confidence: number;
  starters: BsdPredictedStarter[];
}

export interface BsdPredictedLineupResponse {
  event: {
    id: number;
    home_team: string;
    away_team: string;
    date: string;
    league: string;
    status: string;
  };
  lineups: {
    home: BsdPredictedSide;
    away: BsdPredictedSide;
  };
}

export const bsd = {
  /** Full standings table for a given league + season. */
  standings(
    league: number = config.bsd.league,
    season: number = config.bsd.season
  ): Promise<BsdStandingsResponse> {
    return get<BsdStandingsResponse>(
      `/leagues/${league}/standings/?season=${season}`
    );
  },

  /**
   * Team detail. The useful part here is `social` — roughly 20 recent items
   * mixing press coverage and the club's own tweets. BSD has no dedicated news
   * endpoint, so this is the news source.
   */
  team(id: number): Promise<BsdTeamResponse> {
    return get<BsdTeamResponse>(`/teams/${id}/`);
  },

  /** Every fixture a team has played/is scheduled for in a league + season. */
  teamFixtures(
    league: number,
    season: number,
    teamId: number,
    limit: number = 100,
    status?: string
  ): Promise<BsdFixtureListResponse> {
    const statusParam = status ? `&status=${status}` : "";
    return get<BsdFixtureListResponse>(
      `/fixtures/?league=${league}&season=${season}&team_id=${teamId}&limit=${limit}${statusParam}`
    );
  },

  /**
   * A page of fixtures across the whole league, used to enumerate the clubs
   * with fixtures in a season (standings may be empty for live seasons).
   */
  leagueFixtures(
    league: number,
    season: number,
    limit: number = 100,
    offset: number = 0,
    status?: string
  ): Promise<BsdFixtureListResponse> {
    const statusParam = status ? `&status=${status}` : "";
    return get<BsdFixtureListResponse>(
      `/fixtures/?league=${league}&season=${season}&limit=${limit}&offset=${offset}${statusParam}`
    );
  },

  /**
   * Confirmed or AI-predicted lineups for an event, plus per-side
   * `unavailable_players` (injuries/absences).
   */
  v2Lineups(eventId: number): Promise<BsdV2LineupsResponse> {
    return get<BsdV2LineupsResponse>(`/v2/events/${eventId}/lineups/`);
  },

  /** Head-to-head history for the two teams in an event (cross-season). */
  v2H2h(eventId: number): Promise<BsdH2hResponse> {
    return get<BsdH2hResponse>(`/v2/events/${eventId}/h2h/`);
  },

  /**
   * League detail, used to find the live season id (`current_season.id`).
   * The completed seasons pinned in `data/competitions.ts` carry no fixtures.
   */
  currentSeason(league: number): Promise<BsdLeagueResponse> {
    return get<BsdLeagueResponse>(`/leagues/${league}/`);
  },

  /** AI-predicted lineups for an upcoming event, with per-player confidence. */
  predictedLineup(eventId: number): Promise<BsdPredictedLineupResponse> {
    return get<BsdPredictedLineupResponse>(`/predicted-lineup/${eventId}/`);
  },
};
