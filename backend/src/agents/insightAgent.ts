import { LLMClient } from "../llm/llmClient";
import { InsightResult, ValidatedData } from "../types";

/**
 * Deterministic fallback summary — the "template" that pre-dates the LLM.
 * Kept so a missing key, a rate-limited provider, or any failure still yields a
 * complete insight instead of erroring the comparison.
 */
function buildTemplatedInsight(data: ValidatedData): string {
  const { teamA, teamB, headToHead } = data;
  const leader =
    teamA.stats.standingPosition < teamB.stats.standingPosition
      ? teamA.stats
      : teamB.stats;
  const chaser = leader === teamA.stats ? teamB.stats : teamA.stats;

  const h2hWinsA = headToHead.filter(
    (m) =>
      (m.homeTeam === teamA.stats.teamId && m.homeGoals > m.awayGoals) ||
      (m.awayTeam === teamA.stats.teamId && m.awayGoals > m.homeGoals)
  ).length;
  const h2hWinsB = headToHead.filter(
    (m) =>
      (m.homeTeam === teamB.stats.teamId && m.homeGoals > m.awayGoals) ||
      (m.awayTeam === teamB.stats.teamId && m.awayGoals > m.homeGoals)
  ).length;

  const h2hClause =
    headToHead.length > 0
      ? `Over the last ${headToHead.length} meetings, ${teamA.stats.name} have won ${h2hWinsA} and ${teamB.stats.name} have won ${h2hWinsB}. `
      : "";

  return (
    `${leader.name} enter this fixture in stronger form, sitting ${leader.standingPosition}${ordinal(
      leader.standingPosition
    )} in the table with ${leader.wins} wins from ${leader.played} games, compared to ${chaser.name}'s ${
      chaser.standingPosition
    }${ordinal(chaser.standingPosition)}-place finish so far. ` +
    `${leader.name} average ${leader.possessionAvg}% possession with an attack rating of ${leader.attackRating}, ` +
    `while ${chaser.name} counter with a defense rating of ${chaser.defenseRating}. ` +
    h2hClause +
    `${teamA.injuries.length > 0 ? `${teamA.stats.name} are without ${teamA.injuries.map((i) => i.playerName).join(", ")}. ` : ""}` +
    `${teamB.injuries.length > 0 ? `${teamB.stats.name} are missing ${teamB.injuries.map((i) => i.playerName).join(", ")}. ` : ""}` +
    `Expect a tightly contested match with ${leader.name} holding a slight edge.`
  );
}

/** Compact data brief for the LLM. The model must not invent anything outside it. */
function buildDataBrief(data: ValidatedData): string {
  const { teamA, teamB, headToHead } = data;
  return JSON.stringify({
    teamA: {
      name: teamA.stats.name,
      position: teamA.stats.standingPosition,
      played: teamA.stats.played,
      wins: teamA.stats.wins,
      points: teamA.stats.wins * 3 + teamA.stats.draws,
      possessionAvg: teamA.stats.possessionAvg,
      attackRating: teamA.stats.attackRating,
      defenseRating: teamA.stats.defenseRating,
      injuries: teamA.injuries.map((i) => i.playerName),
    },
    teamB: {
      name: teamB.stats.name,
      position: teamB.stats.standingPosition,
      played: teamB.stats.played,
      wins: teamB.stats.wins,
      points: teamB.stats.wins * 3 + teamB.stats.draws,
      possessionAvg: teamB.stats.possessionAvg,
      attackRating: teamB.stats.attackRating,
      defenseRating: teamB.stats.defenseRating,
      injuries: teamB.injuries.map((i) => i.playerName),
    },
    headToHead: headToHead.map((m) => ({
      date: m.date,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
    })),
  });
}

function buildPrompt(data: ValidatedData): string {
  return (
    `Here is the verified data for the upcoming fixture:\n\n` +
    `${buildDataBrief(data)}\n\n` +
    `Write 3-4 sentences of football match insight based ONLY on this data. ` +
    `Reference both teams by name, compare their form, highlight any injury absences ` +
    `or head-to-head context, and give a measured outlook. Do not invent statistics, ` +
    `do not use markdown, and do not add a preamble.`
  );
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function runInsightAgent(
  data: ValidatedData,
  llm: LLMClient
): Promise<InsightResult> {
  const template = buildTemplatedInsight(data);

  if (llm.kind === "template") {
    return { summary: template, generatedBy: "template" };
  }

  try {
    const summary = await llm.generateInsight(buildPrompt(data));
    return { summary, generatedBy: "ai" };
  } catch (err) {
    console.warn(`[insightAgent] LLM unavailable, using template: ${errMsg(err)}`);
    return { summary: template, generatedBy: "template" };
  }
}
