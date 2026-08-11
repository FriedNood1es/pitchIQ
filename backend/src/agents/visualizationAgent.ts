import { ValidatedData, VisualizationResult } from "../types";

const formPoints: Record<string, number> = { W: 3, D: 1, L: 0 };

/** 2.5 goals/game ≈ elite scoring; keeps the axis comparable to the ratings. */
function goalsPerGameNormalized(goalsFor: number, played: number): number {
  const perGame = played > 0 ? goalsFor / played : 0;
  return Math.max(0, Math.min(100, Math.round((perGame / 2.5) * 100)));
}

export function runVisualizationAgent(data: ValidatedData): VisualizationResult {
  const { teamA, teamB } = data;

  return {
    radar: {
      // Raw goal totals (≈62) must not share a 0–100 axis with the ratings —
      // they would flatten the whole shape. Scale goals-per-game instead.
      labels: ["Attack", "Defense", "Possession", "Win %", "Goals/game"],
      datasets: [
        {
          label: teamA.stats.name,
          data: [
            teamA.stats.attackRating,
            teamA.stats.defenseRating,
            teamA.stats.possessionAvg,
            Math.round((teamA.stats.wins / teamA.stats.played) * 100),
            goalsPerGameNormalized(teamA.stats.goalsFor, teamA.stats.played),
          ],
        },
        {
          label: teamB.stats.name,
          data: [
            teamB.stats.attackRating,
            teamB.stats.defenseRating,
            teamB.stats.possessionAvg,
            Math.round((teamB.stats.wins / teamB.stats.played) * 100),
            goalsPerGameNormalized(teamB.stats.goalsFor, teamB.stats.played),
          ],
        },
      ],
    },
    form: {
      labels: [teamA.stats.name, teamB.stats.name],
      datasets: [
        {
          label: "Form points (last 5)",
          data: [teamA.stats.form, teamB.stats.form].map((form) =>
            form.reduce((sum, result) => sum + (formPoints[result] ?? 0), 0)
          ),
        },
      ],
    },
  };
}
