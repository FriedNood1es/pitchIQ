import { LLMClient } from "../llm/llmClient";
import { InsightResult, Prediction, ValidatedData } from "../types";

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
  const brief = (t: typeof teamA) => ({
    name: t.stats.name,
    position: t.stats.standingPosition,
    played: t.stats.played,
    wins: t.stats.wins,
    points: t.stats.wins * 3 + t.stats.draws,
    goalsPerGame: round2(t.stats.goalsFor / Math.max(1, t.stats.played)),
    concededPerGame: round2(t.stats.goalsAgainst / Math.max(1, t.stats.played)),
    form: t.stats.form.join(""),
    formPoints: t.stats.form.reduce((n, r) => n + (r === "W" ? 3 : r === "D" ? 1 : 0), 0),
    possessionAvg: t.stats.possessionAvg,
    attackRating: t.stats.attackRating,
    defenseRating: t.stats.defenseRating,
    injuries: t.injuries.map((i) => i.playerName),
  });
  return JSON.stringify({
    teamA: brief(teamA),
    teamB: brief(teamB),
    headToHead: headToHead.map((m) => ({
      date: m.date,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
    })),
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildPrompt(data: ValidatedData): string {
  return (
    `Here is the verified data for the upcoming fixture:\n\n` +
    `${buildDataBrief(data)}\n\n` +
    `Return ONLY valid JSON with this shape (no markdown, no preamble):\n` +
    `{"summary": "3-4 sentences of football match insight comparing form, ` +
    `highlighting injuries and head-to-head context, with a measured outlook", ` +
    `"homeWin": <0-100>, "draw": <0-100>, "awayWin": <0-100>, ` +
    `"confidence": "low" | "medium" | "high", ` +
    `"keyFactor": "one sentence naming the single biggest differentiator"}\n` +
    `homeWin + draw + awayWin must sum to 100. Weigh expected goals, form ` +
    `trajectory, injuries and head-to-head. Do not invent statistics.`
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

/**
 * Deterministic prediction from the same weighted scoring as the frontend
 * data edge (edge.ts): ratings, points, form and H2H on a common scale.
 * A sigmoid maps the signed edge value to win probability; the draw share
 * shrinks as the matchup gets less balanced. Calibrated: value 0 → 38/24/38,
 * 6 → 47/20/33, 14 → 58/16/26, 20 → 68/12/20.
 */
function buildDeterministicPrediction(data: ValidatedData): Prediction {
  const a = data.teamA.stats;
  const b = data.teamB.stats;
  const ppg = (t: typeof a) => (t.wins * 3 + t.draws) / Math.max(1, t.played);
  const formPts = (t: typeof a) =>
    t.form.reduce((n, r) => n + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  let value =
    a.attackRating - b.attackRating +
    (a.defenseRating - b.defenseRating) +
    (a.possessionAvg - b.possessionAvg) / 2 +
    (ppg(a) - ppg(b)) * 8 +
    (formPts(a) - formPts(b));
  let wa = 0;
  let wb = 0;
  for (const m of data.headToHead) {
    if (m.homeGoals === m.awayGoals) continue;
    const homeA = m.homeTeam === a.teamId;
    const aWon = homeA ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
    if (aWon) wa++;
    else wb++;
  }
  value += (wa - wb) * 2;

  const strength = 1 / (1 + Math.exp(-value * 0.08));
  const draw = Math.max(12, Math.round(24 - Math.abs(value) * 0.6));
  const remaining = 100 - draw;
  const homeWin = Math.round(remaining * strength);
  const awayWin = 100 - draw - homeWin;
  const abs = Math.abs(value);
  const confidence = abs < 6 ? "low" : abs < 14 ? "medium" : "high";

  // Key factor: the largest single contributor, labeled with the leader.
  const leader = value > 0 ? a : b;
  const parts: { label: string; v: number }[] = [
    { label: `attack rating ${Math.round(leader.attackRating)}`, v: Math.abs(a.attackRating - b.attackRating) },
    { label: `defense rating ${Math.round(leader.defenseRating)}`, v: Math.abs(a.defenseRating - b.defenseRating) },
    { label: `${(ppg(leader)).toFixed(1)} pts/game`, v: Math.abs(ppg(a) - ppg(b)) * 8 },
    { label: `recent form ${formPts(leader)} pts`, v: Math.abs(formPts(a) - formPts(b)) },
  ];
  parts.sort((x, y) => y.v - x.v);
  const keyFactor = `${leader.name}'s ${parts[0].label} leads the matchup.`;

  return { homeWin, draw, awayWin, confidence, keyFactor };
}

/** Parse the LLM's JSON output; null when malformed or out of range. */
function parsePrediction(raw: string): { summary: string; prediction: Prediction } | null {
  try {
    const json = JSON.parse(raw) as {
      summary?: unknown;
      homeWin?: unknown;
      draw?: unknown;
      awayWin?: unknown;
      confidence?: unknown;
      keyFactor?: unknown;
    };
    if (typeof json.summary !== "string" || !json.summary.trim()) return null;
    const nums = [json.homeWin, json.draw, json.awayWin];
    if (!nums.every((n) => typeof n === "number" && n >= 0 && n <= 100)) return null;
    if (Math.round((json.homeWin as number) + (json.draw as number) + (json.awayWin as number)) !== 100) return null;
    if (!["low", "medium", "high"].includes(json.confidence as string)) return null;
    if (typeof json.keyFactor !== "string" || !json.keyFactor.trim()) return null;
    return {
      summary: (json.summary as string).trim(),
      prediction: {
        homeWin: json.homeWin as number,
        draw: json.draw as number,
        awayWin: json.awayWin as number,
        confidence: json.confidence as Prediction["confidence"],
        keyFactor: (json.keyFactor as string).trim(),
      },
    };
  } catch {
    return null;
  }
}

export async function runInsightAgent(
  data: ValidatedData,
  llm: LLMClient
): Promise<InsightResult> {
  const template = buildTemplatedInsight(data);
  const fallback = buildDeterministicPrediction(data);

  if (llm.kind === "template") {
    return { summary: template, prediction: fallback, generatedBy: "template" };
  }

  try {
    const raw = await llm.generateInsight(buildPrompt(data));
    // Some models wrap JSON in fences or preamble — extract the object.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const parsed = start >= 0 && end > start ? parsePrediction(raw.slice(start, end + 1)) : null;
    if (!parsed) throw new Error("LLM returned malformed prediction JSON");
    return { summary: parsed.summary, prediction: parsed.prediction, generatedBy: "ai" };
  } catch (err) {
    console.warn(`[insightAgent] LLM unavailable, using template: ${errMsg(err)}`);
    return { summary: template, prediction: fallback, generatedBy: "template" };
  }
}
