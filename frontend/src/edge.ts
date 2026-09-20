import { CompareReport, TeamStats } from "./types";

export interface DataEdge {
  /** Signed: positive favors teamA, negative favors teamB. */
  value: number;
  /** Null inside the toss-up band. */
  leader: "A" | "B" | null;
  strength: "Toss-up" | "Lean" | "Edge";
  /** Strongest contributors first, at most 2, plain words. */
  reasons: string[];
}

const formPoints: Record<string, number> = { W: 3, D: 1, L: 0 };
const sumForm = (form: string[]) =>
  form.reduce((n, r) => n + (formPoints[r] ?? 0), 0);
/** League points from a record — single copy for every table/hero/row. */
export const points = (t: TeamStats) => t.wins * 3 + t.draws;
const ppg = (t: TeamStats) => points(t) / Math.max(1, t.played);

/**
 * Deterministic data edge from numbers already in the report. Ratings are
 * 0-100; points, form and H2H are scaled to match so no input dominates.
 * Not a prediction model — labeled "data edge" wherever shown.
 */
export function computeEdge(report: CompareReport): DataEdge {
  const a = report.teams.teamA.stats;
  const b = report.teams.teamB.stats;
  const parts: { short: string; full: string; v: number }[] = [];
  const r0 = (n: number) => Math.round(n);
  parts.push({
    short: "attack",
    full: `attack ${r0(a.attackRating)} vs ${r0(b.attackRating)}`,
    v: a.attackRating - b.attackRating,
  });
  parts.push({
    short: "defense",
    full: `defense ${r0(a.defenseRating)} vs ${r0(b.defenseRating)}`,
    v: a.defenseRating - b.defenseRating,
  });
  parts.push({
    short: "possession",
    full: `possession ${r0(a.possessionAvg)}% vs ${r0(b.possessionAvg)}%`,
    v: (a.possessionAvg - b.possessionAvg) / 2,
  });
  parts.push({
    short: "points per game",
    full: `${ppg(a).toFixed(1)} pts/game vs ${ppg(b).toFixed(1)}`,
    v: (ppg(a) - ppg(b)) * 8,
  });
  const fa = sumForm(a.form);
  const fb = sumForm(b.form);
  parts.push({
    short: "recent form",
    full: `recent form ${fa} pts vs ${fb} pts`,
    v: fa - fb,
  });
  let wa = 0;
  let wb = 0;
  for (const m of report.headToHead) {
    if (m.homeGoals === m.awayGoals) continue;
    const homeA = m.homeTeam === report.intent.teamA;
    const aWon = homeA ? m.homeGoals > m.awayGoals : m.awayGoals > m.homeGoals;
    if (aWon) wa++;
    else wb++;
  }
  if (wa + wb > 0) {
    parts.push({
      short: "head-to-head",
      full: `head-to-head ${wa}W-${wb}L`,
      v: (wa - wb) * 2,
    });
  }

  const value = parts.reduce((n, p) => n + p.v, 0);
  const abs = Math.abs(value);
  const strength = abs < 6 ? "Toss-up" : abs < 14 ? "Lean" : "Edge";
  const leader = strength === "Toss-up" ? null : value > 0 ? "A" : "B";
  const top = parts
    .slice()
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v))
    .slice(0, 2);
  // Reasons face the leader ("Arsenal attack +8"); toss-ups stay neutral.
  const reasons = leader
    ? top.map((p) => {
        const name =
          leader === "A"
            ? report.teams.teamA.stats.name
            : report.teams.teamB.stats.name;
        return `${name} ${p.short} +${Math.abs(Math.round(p.v))}`;
      })
    : top.map((p) => p.full);
  return { value: Math.round(value * 10) / 10, leader, strength, reasons };
}
