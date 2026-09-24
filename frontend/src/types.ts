export type TeamId = string;

export interface TeamSummary {
  id: TeamId;
  name: string;
  crestColor: string;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
}

export interface TeamStats {
  teamId: TeamId;
  name: string;
  crestColor: string;
  standingPosition: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string[];
  attackRating: number;
  defenseRating: number;
  possessionAvg: number;
}

export interface Injury {
  playerName: string;
  position: string;
  status: "out" | "doubtful";
  expectedReturn: string;
}

export interface LineupPlayer {
  name: string;
  position: string; // GK / DEF / MID / FWD grouping
  jerseyNumber?: number;
  /** 0-100 AI confidence for predicted lineups (null for confirmed XIs). */
  aiScore?: number;
  captain?: boolean;
}

export interface Lineup {
  formation: string;
  /** 0-1 model confidence; present only on predicted lineups. */
  confidence?: number;
  confirmed: boolean;
  startingXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface HeadToHeadMatch {
  date: string;
  homeTeam: TeamId;
  awayTeam: TeamId;
  homeGoals: number;
  awayGoals: number;
}

/** Cross-season H2H aggregates, framed from team A's perspective. */
export interface H2hAggregates {
  totalMatches: number;
  winsA: number;
  draws: number;
  winsB: number;
  avgTotalGoals: number;
  winRateA: number;
  drawRate: number;
  winRateB: number;
}

export interface NewsItem {
  teamId: TeamId;
  headline: string;
  summary: string;
  publishedAt: string;
  /** Outlet name for press items, club/account name for tweets. */
  source?: string;
  url?: string;
  kind?: "news" | "tweet";
  /** Third-party story artwork — may be absent or dead; rows degrade to text. */
  thumbnail?: string;
}

export interface RadarDataset {
  label: string;
  data: number[];
}

export interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: "low" | "medium" | "high";
  keyFactor: string;
}

export interface CompareReport {
  intent: { type: "team_comparison"; competition: string; teamA: TeamId; teamB: TeamId };
  teams: {
    teamA: { stats: TeamStats; injuries: Injury[]; lineup?: Lineup };
    teamB: { stats: TeamStats; injuries: Injury[]; lineup?: Lineup };
  };
  headToHead: HeadToHeadMatch[];
  headToHeadAggregates?: H2hAggregates;
  validationIssues: { field: string; message: string }[];
  insight: string;
  insightGeneratedBy: "ai" | "template";
  prediction: Prediction;
  news: { teamA: NewsItem[]; teamB: NewsItem[] };
  visualization: {
    radar: { labels: string[]; datasets: RadarDataset[] };
    form: { labels: string[]; datasets: { label: string; data: number[] }[] };
  };
  generatedAt: string;
}

export interface PreviewEvent {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: string;
}

export interface PredictedLineupPlayer {
  name: string;
  position: string; // GK / DEF / MID / FWD grouping
  jerseyNumber?: number;
  /** 0-100 model confidence this player starts. */
  aiScore?: number;
  predictedSlot?: string;
  availability: string;
  injuryType: string;
}

export interface TeamPreview {
  name: string;
  formation: string;
  /** 0-1 model confidence in the predicted XI. */
  confidence?: number;
  starters: PredictedLineupPlayer[];
}

export interface PreviewReport {
  competition: string;
  team: TeamId;
  event?: PreviewEvent;
  home: TeamPreview;
  away: TeamPreview;
  message?: string;
  generatedAt: string;
}

/** The preview team picker list (compare lists may also carry bsdTeamId). */
export interface PreviewTeamSummary extends TeamSummary {
  bsdTeamId: number;
}

/** A global-search hit, tagged with its competition so the UI can route to it. */
export interface TeamSearchResult extends TeamSummary {
  competition: string;
  competitionName: string;
  country: string;
}

export type FixturesStatus = "all" | "finished" | "scheduled" | "live";

export interface FixtureTeam extends TeamSummary {
  /** Preview-style slug (slugify of the name) — matches the preview picker ids. */
  id: TeamId;
}

export interface Fixture {
  competition: string;
  competitionName: string;
  country: string;
  eventId: number;
  date: string;
  status: "finished" | "scheduled" | "live";
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  homeScore: number | null;
  awayScore: number | null;
}
