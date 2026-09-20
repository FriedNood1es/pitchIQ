import { Fixture } from "../types";
import { formatCountdown, useCountdown, useNow } from "../hooks/useCountdown";
import { TeamCrest } from "./TeamCrest";

export function kickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Ticking countdown to kickoff, with the kickoff clock kept as a secondary line. */
function CountdownCell({ date }: { date: string }) {
  const remaining = useCountdown(date);
  return (
    <>
      <span className="font-semibold tabular-nums text-[var(--text)]">
        {formatCountdown(remaining)}
      </span>
      <span className="text-xs tabular-nums text-[var(--muted)]">{kickoff(date)}</span>
    </>
  );
}

/** LIVE badge + elapsed minute for the time column (scores sit on each team line). */
function LiveCell({ date }: { date: string }) {
  // ponytail: one 1s interval per live row; lift to a shared useNow per list if live fixtures ever scale.
  const now = useNow(1000);
  const elapsedMin = Math.max(
    0,
    Math.floor((now - new Date(date).getTime()) / 60_000)
  );
  return (
    <>
      <span
        className="flex items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--on-color)]"
        style={{ background: "var(--loss)" }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--on-color)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--on-color)]" />
        </span>
        Live
      </span>
      <span className="text-xs font-semibold tabular-nums text-[var(--loss)]">
        {elapsedMin}&prime;
      </span>
    </>
  );
}

/** One team line: monogram + name, with a right-aligned score once played/live. */
function TeamLine({
  name,
  crestColor,
  competition,
  score,
}: {
  name: string;
  crestColor: string;
  competition: string;
  score?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamCrest name={name} crestColor={crestColor} competition={competition} size={20} />
      <span className="truncate text-sm font-semibold text-[var(--text)]">
        {name}
      </span>
      {score !== undefined && (
        <span className="ml-auto pl-3 font-bold tabular-nums text-[var(--text)]">
          {score}
        </span>
      )}
    </span>
  );
}

/**
 * One fixture row: time column, home-over-away lines, chevron — shared
 * between the fixtures landing and the team dashboard.
 */
export function MatchRow({
  fixture,
  onClick,
  pending,
}: {
  fixture: Fixture;
  onClick: () => void;
  /** True while the click is resolving standings slugs — blocks double-taps. */
  pending?: boolean;
}) {
  // Finished rows are NOT dimmed: opacity reads as disabled. The FT label
  // + per-line scores in the time column already separate them.
  const scored = fixture.status === "finished" || fixture.status === "live";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending || undefined}
      title={
        pending
          ? "Loading comparison…"
          : "Compare these clubs — stats, head-to-head and prediction. Tap to open."
      }
      className={`group grid min-h-[48px] w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-2)] focus-visible:border-[var(--brand)] ${
        pending ? "cursor-wait opacity-60" : ""
      }`}
    >
      <span className="flex w-14 flex-col items-start justify-center gap-0.5 text-sm">
        {fixture.status === "finished" && (
          <>
            <span className="text-xs font-bold tabular-nums text-[var(--muted)]">FT</span>
            <span className="text-xs tabular-nums text-[var(--muted)]">{kickoff(fixture.date)}</span>
          </>
        )}
        {fixture.status === "live" && <LiveCell date={fixture.date} />}
        {fixture.status === "scheduled" && <CountdownCell date={fixture.date} />}
      </span>
      <span className="flex min-w-0 flex-col justify-center gap-1 py-0.5">
        <TeamLine
          name={fixture.homeTeam.name}
          crestColor={fixture.homeTeam.crestColor}
          competition={fixture.competition}
          score={scored ? fixture.homeScore ?? 0 : undefined}
        />
        <TeamLine
          name={fixture.awayTeam.name}
          crestColor={fixture.awayTeam.crestColor}
          competition={fixture.competition}
          score={scored ? fixture.awayScore ?? 0 : undefined}
        />
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-xs font-bold text-[var(--muted)] transition group-hover:text-[var(--brand)] group-focus-visible:text-[var(--brand)]"
      >
        {pending ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
        ) : (
          <>Compare&nbsp;›</>
        )}
      </span>
    </button>
  );
}
