import { TeamStats } from "../types";
import { FormPills } from "./FormPills";

interface Props {
  stats: TeamStats;
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="text-xl font-extrabold tabular-nums text-[var(--text)]">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-[var(--text-2)]">{label}</span>
        <span className="tabular-nums text-[var(--text)]">{value}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-2 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "var(--brand)" }}
        />
      </div>
    </div>
  );
}

/** Season stats for one team: position, record, form and skill ratings. */
export function TeamStatsPanel({ stats }: Props) {
  const points = stats.wins * 3 + stats.draws;
  const goalDiff = stats.goalsFor - stats.goalsAgainst;

  return (
    <div className="tl-card p-5">
      <h2 className="tl-card-title">Season Stats</h2>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Headline label="Position" value={`${stats.standingPosition}${ordinal(stats.standingPosition)}`} />
        <Headline label="Points" value={`${points}`} />
        <Headline label="Played" value={`${stats.played}`} />
        <Headline
          label="Goal diff"
          value={`${goalDiff >= 0 ? "+" : ""}${goalDiff}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 text-sm">
          <span className="font-semibold text-[var(--text-2)]">Record</span>
          <span className="tabular-nums text-[var(--text)]">
            {stats.wins}<span className="px-0.5 text-[var(--muted)]">W</span>
            {stats.draws}<span className="px-0.5 text-[var(--muted)]">D</span>
            {stats.losses}<span className="px-0.5 text-[var(--muted)]">L</span>
          </span>
          <span className="tabular-nums text-[var(--muted)]">
            {stats.goalsFor}–{stats.goalsAgainst} (GF–GA)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-[var(--text-2)]">Form</span>
          <FormPills form={stats.form} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <RatingBar label="Attack rating" value={stats.attackRating} />
        <RatingBar label="Defense rating" value={stats.defenseRating} />
        <RatingBar label="Possession (est.)" value={stats.possessionAvg} />
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 11 || n === 12 || n === 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
