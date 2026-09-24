/**
 * A team identifier is a name-derived slug (e.g. "arsenal",
 * "manchester-city"). Slugs are resolved dynamically from the active data
 * provider's standings table, so any team in the league is valid — there is
 * no fixed union to maintain.
 */
export type TeamId = string;

export interface TeamSummary {
  id: TeamId;
  name: string;
  crestColor: string;
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
  form: string[]; // last 5 results, e.g. ["W", "W", "D", "L", "W"]
  attackRating: number; // 0-100
  defenseRating: number; // 0-100
  possessionAvg: number; // 0-100
  /** Per-game expected goals — present only when the season carries xG. */
  expectedGoalsFor?: number;
  expectedGoalsAgainst?: number;
}

export interface Injury {
  playerName: string;
  position: string;
  status: "out" | "doubtful";
  expectedReturn: string;
}

export interface LineupPlayer {
  name: string;
  position: string; // GK / DEF / MID / FWD grouping hint
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

/**
 * Cross-season H2H aggregates from BSD's h2h payload, framed from team A's
 * perspective. Rates are derived from the counts (BSD's own rate fields are
 * an unverified scale), rounded to whole percent.
 */
export interface H2hAggregates {
  totalMatches: number;
  winsA: number;
  draws: number;
  winsB: number;
  avgTotalGoals: number; // 1dp
  winRateA: number;
  drawRate: number;
  winRateB: number;
}

export interface NewsItem {
  teamId: TeamId;
  headline: string;
  summary: string;
  publishedAt: string; // ISO 8601
  /** Outlet name for press items, club/account name for tweets. */
  source?: string;
  url?: string;
  kind?: "news" | "tweet";
  /** Third-party story artwork (BSD `thumbnail`) — absent on tweets. May die; UI must degrade. */
  thumbnail?: string;
}

export interface RetrievedTeamData {
  stats: TeamStats;
  injuries: Injury[];
  /** Most recent confirmed/predicted XI. Absent when the provider has none. */
  lineup?: Lineup;
  /** Predicted next XI from the preview model. Absent with no upcoming fixture. */
  predictedLineup?: Lineup;
}

export interface CompareRequest {
  competition: string;
  teamA: TeamId;
  teamB: TeamId;
}

export interface Intent {
  type: "team_comparison";
  competition: string;
  teamA: TeamId;
  teamB: TeamId;
}

export interface RetrievalResult {
  teamA: RetrievedTeamData;
  teamB: RetrievedTeamData;
  headToHead: HeadToHeadMatch[];
  /** Absent when the clubs share no mutual event (same cases as empty H2H). */
  headToHeadAggregates?: H2hAggregates;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidatedData extends RetrievalResult {
  issues: ValidationIssue[];
}

export interface InsightResult {
  summary: string;
  prediction: Prediction;
  /** Whether the summary was written by a real LLM or the deterministic template. */
  generatedBy: "ai" | "template";
}

/** Structured win/draw/loss probabilities. Percentages sum to 100. */
export interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  confidence: "low" | "medium" | "high";
  /** One sentence: the single biggest differentiator. */
  keyFactor: string;
}

export interface NewsResult {
  teamA: NewsItem[];
  teamB: NewsItem[];
}

/**
 * Bookmaker odds for the clubs' next meeting, framed from team A.
 * Absent when there is no upcoming fixture or the markets are still null
 * (BSD publishes them ~a day before kickoff).
 */
export interface EventOdds {
  teamAWin: number;
  draw: number;
  teamBWin: number;
  over25Goals: number;
  eventDate: string;
}

export interface RadarDataset {
  label: string;
  data: number[];
}

export interface VisualizationResult {
  radar: {
    labels: string[];
    datasets: RadarDataset[];
  };
  form: {
    labels: string[]; // team names
    datasets: { label: string; data: number[] }[]; // W/D/L mapped to points
  };
}

export interface CompareReport {
  intent: Intent;
  teams: {
    teamA: RetrievedTeamData;
    teamB: RetrievedTeamData;
  };
  headToHead: HeadToHeadMatch[];
  headToHeadAggregates?: H2hAggregates;
  validationIssues: ValidationIssue[];
  insight: string;
  /** Whether insight came from a real LLM ("ai") or the template ("template"). */
  insightGeneratedBy: "ai" | "template";
  /** Structured probabilities — "ai" when the LLM produced them, else the deterministic model. */
  prediction: Prediction;
  upcomingOdds?: EventOdds;
  news: NewsResult;
  visualization: VisualizationResult;
  generatedAt: string;
}

/** An upcoming fixture a team previews. */
export interface PreviewEvent {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string; // ISO 8601
  status: string;
}

export interface PredictedLineupPlayer {
  name: string;
  position: string; // GK / DEF / MID / FWD grouping
  jerseyNumber?: number;
  /** 0-100 model confidence this player starts. */
  aiScore?: number;
  /** BSD's granular slot (e.g. "LB", "CAM"); only present when mapped. */
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
  /** Slug of the team the user asked to preview. */
  team: TeamId;
  event?: PreviewEvent;
  home: TeamPreview;
  away: TeamPreview;
  /** Populated when no upcoming fixture could be found. */
  message?: string;
  generatedAt: string;
}
