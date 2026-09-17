import {
  CompareReport,
  Competition,
  Fixture,
  FixturesStatus,
  PreviewReport,
  PreviewTeamSummary,
  TeamId,
  TeamSearchResult,
  TeamStats,
  TeamSummary,
} from "../types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Status travels on the error so callers can tell expected 404s
    // (no pinned-season row — permanent) from retryable failures.
    throw Object.assign(
      new Error(body.error ?? `Request failed with status ${res.status}`),
      { status: res.status }
    );
  }
  return res.json();
}

export function fetchCompetitions(): Promise<Competition[]> {
  return getJson<Competition[]>("/api/competitions");
}

export function fetchTeams(competition: string): Promise<TeamSummary[]> {
  return getJson<TeamSummary[]>(`/api/teams?competition=${encodeURIComponent(competition)}`);
}

export function fetchPreviewTeams(competition: string): Promise<PreviewTeamSummary[]> {
  return getJson<PreviewTeamSummary[]>(
    `/api/preview-teams?competition=${encodeURIComponent(competition)}`
  );
}

/** Recent/upcoming matches. Empty competition = all supported leagues. */
export function fetchFixtures(
  competition: string,
  status: FixturesStatus
): Promise<Fixture[]> {
  const params = new URLSearchParams();
  if (competition) params.set("competition", competition);
  params.set("status", status);
  return getJson<Fixture[]>(`/api/fixtures?${params.toString()}`);
}

export function fetchPreview(competition: string, team: TeamId): Promise<PreviewReport> {
  return getJson<PreviewReport>(
    `/api/preview?competition=${encodeURIComponent(competition)}&team=${encodeURIComponent(team)}`
  );
}

/** Global team search across all competitions (backend index is cached). */
export function fetchSearch(q: string): Promise<TeamSearchResult[]> {
  return getJson<TeamSearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`);
}

/** Season stats for one team, matched by display name against standings. */
export function fetchTeamStats(competition: string, name: string): Promise<TeamStats> {
  return getJson<TeamStats>(
    `/api/team-stats?competition=${encodeURIComponent(competition)}&name=${encodeURIComponent(name)}`
  );
}

/** Full standings table for a competition, ordered by position. */
export function fetchStandings(competition: string): Promise<TeamStats[]> {
  return getJson<TeamStats[]>(
    `/api/standings?competition=${encodeURIComponent(competition)}`
  );
}

export async function fetchComparison(
  competition: string,
  teamA: TeamId,
  teamB: TeamId
): Promise<CompareReport> {
  const res = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competition, teamA, teamB }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}
