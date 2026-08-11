import {
  Injury,
  Lineup,
  PredictedLineupPlayer,
  PreviewReport,
  RetrievedTeamData,
  TeamId,
  TeamPreview,
  TeamStats,
  TeamSummary,
} from "../types";

const teamStats: Record<string, TeamStats> = {
  arsenal: {
    teamId: "arsenal",
    name: "Arsenal",
    crestColor: "#EF0107",
    standingPosition: 2,
    played: 30,
    wins: 20,
    draws: 6,
    losses: 4,
    goalsFor: 62,
    goalsAgainst: 28,
    form: ["W", "W", "D", "W", "L"],
    attackRating: 86,
    defenseRating: 81,
    possessionAvg: 58,
  },
  chelsea: {
    teamId: "chelsea",
    name: "Chelsea",
    crestColor: "#034694",
    standingPosition: 6,
    played: 30,
    wins: 15,
    draws: 8,
    losses: 7,
    goalsFor: 51,
    goalsAgainst: 35,
    form: ["L", "W", "W", "D", "W"],
    attackRating: 78,
    defenseRating: 70,
    possessionAvg: 54,
  },
};

const teamInjuries: Record<string, Injury[]> = {
  arsenal: [
    {
      playerName: "Gabriel Magalhaes",
      position: "CB",
      status: "doubtful",
      expectedReturn: "2026-07-14",
    },
  ],
  chelsea: [
    {
      playerName: "Reece James",
      position: "RB",
      status: "out",
      expectedReturn: "2026-08-01",
    },
    {
      playerName: "Romeo Lavia",
      position: "CM",
      status: "doubtful",
      expectedReturn: "2026-07-20",
    },
  ],
};

const teamLineups: Record<string, Lineup> = {
  arsenal: {
    formation: "4-3-3",
    confirmed: false,
    startingXI: [
      { name: "David Raya", position: "GK", jerseyNumber: 22 },
      { name: "Ben White", position: "DEF", jerseyNumber: 4 },
      { name: "William Saliba", position: "DEF", jerseyNumber: 2 },
      { name: "Gabriel Magalhaes", position: "DEF", jerseyNumber: 6 },
      { name: "Jurrien Timber", position: "DEF", jerseyNumber: 12 },
      { name: "Martin Odegaard", position: "MID", jerseyNumber: 8, captain: true },
      { name: "Declan Rice", position: "MID", jerseyNumber: 41 },
      { name: "Kai Havertz", position: "MID", jerseyNumber: 29 },
      { name: "Bukayo Saka", position: "FWD", jerseyNumber: 7 },
      { name: "Gabriel Jesus", position: "FWD", jerseyNumber: 9 },
      { name: "Leandro Trossard", position: "FWD", jerseyNumber: 19 },
    ],
    substitutes: [
      { name: "Neto", position: "GK", jerseyNumber: 32 },
      { name: "Mikel Merino", position: "MID", jerseyNumber: 23 },
    ],
  },
  chelsea: {
    formation: "4-2-3-1",
    confirmed: false,
    startingXI: [
      { name: "Robert Sanchez", position: "GK", jerseyNumber: 1 },
      { name: "Reece James", position: "DEF", jerseyNumber: 24 },
      { name: "Wesley Fofana", position: "DEF", jerseyNumber: 33 },
      { name: "Levi Colwill", position: "DEF", jerseyNumber: 26 },
      { name: "Marc Cucurella", position: "DEF", jerseyNumber: 3 },
      { name: "Moises Caicedo", position: "MID", jerseyNumber: 25 },
      { name: "Romeo Lavia", position: "MID", jerseyNumber: 45 },
      { name: "Cole Palmer", position: "MID", jerseyNumber: 20 },
      { name: "Enzo Fernandez", position: "MID", jerseyNumber: 8 },
      { name: "Jadon Sancho", position: "MID", jerseyNumber: 11 },
      { name: "Nicolas Jackson", position: "FWD", jerseyNumber: 15 },
    ],
    substitutes: [
      { name: "Filip Jorgensen", position: "GK", jerseyNumber: 12 },
      { name: "Christopher Nkunku", position: "FWD", jerseyNumber: 18 },
    ],
  },
};

export function getTeamData(teamId: TeamId): RetrievedTeamData {
  const stats = teamStats[teamId];
  if (!stats) {
    throw new Error(`No mock data for team "${teamId}" (try arsenal or chelsea)`);
  }
  return {
    stats,
    injuries: teamInjuries[teamId] ?? [],
    lineup: teamLineups[teamId],
  };
}

/** Teams available in mock mode (fixtures only cover a couple of clubs). */
export function listMockTeams(): TeamSummary[] {
  return Object.values(teamStats)
    .map((s) => ({ id: s.teamId, name: s.name, crestColor: s.crestColor }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toPredictedStarter(p: Lineup["startingXI"][number]): PredictedLineupPlayer {
  return {
    name: p.name,
    position: p.position,
    jerseyNumber: p.jerseyNumber,
    aiScore: 80,
    availability: "available",
    injuryType: "",
  };
}

/** Mock predicted lineups for the selected team's next fixture. */
export function getTeamPreview(teamId: TeamId): {
  event: PreviewReport["event"];
  home: TeamPreview;
  away: TeamPreview;
} {
  const stats = teamStats[teamId];
  if (!stats) {
    throw new Error(`No mock data for team "${teamId}" (try arsenal or chelsea)`);
  }
  const opponentId: TeamId = teamId === "arsenal" ? "chelsea" : "arsenal";
  const opponent = teamStats[opponentId];

  const lineup = teamLineups[teamId];
  const opponentLineup = teamLineups[opponentId];

  const toPreview = (name: string, l?: Lineup): TeamPreview => ({
    name,
    formation: l?.formation ?? "4-3-3",
    confidence: 0.72,
    starters: (l?.startingXI ?? []).map(toPredictedStarter),
  });

  return {
    event: {
      id: 999,
      homeTeam: stats.name,
      awayTeam: opponent.name,
      date: "2026-08-15T15:00:00Z",
      status: "notstarted",
    },
    home: toPreview(stats.name, lineup),
    away: toPreview(opponent.name, opponentLineup),
  };
}
