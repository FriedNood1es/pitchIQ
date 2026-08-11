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

/** LIVE badge, elapsed-minute clock (from kickoff) and the live score. */
function LiveCell({ fixture }: { fixture: Fixture }) {
  const now = useNow(1000);
  const elapsedMin = Math.max(
    0,
    Math.floor((now - new Date(fixture.date).getTime()) / 60_000)
  );
  return (
    <>
      <span className="flex items-center justify-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        Live
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-bold tabular-nums text-[var(--text)]">
          {fixture.homeScore ?? 0}
          <span className="px-0.5 text-[var(--muted)]">–</span>
          {fixture.awayScore ?? 0}
        </span>
        <span className="text-xs font-semibold tabular-nums text-[var(--loss)]">
          {elapsedMin}&prime;
        </span>
      </span>
    </>
  );
}

/** One fixture row — shared between the fixtures landing and the team dashboard. */
export function MatchRow({ fixture, onClick }: { fixture: Fixture; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <TeamCrest
          name={fixture.homeTeam.name}
          crestColor={fixture.homeTeam.crestColor}
          size={20}
        />
        <span className="truncate text-sm font-semibold text-[var(--text)]">
          {fixture.homeTeam.name}
        </span>
      </span>
      <span className="flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 text-sm">
        {fixture.status === "finished" && (
          <span className="font-bold tabular-nums text-[var(--text)]">
            {fixture.homeScore ?? 0}
            <span className="px-1 text-[var(--muted)]">–</span>
            {fixture.awayScore ?? 0}
          </span>
        )}
        {fixture.status === "live" && <LiveCell fixture={fixture} />}
        {fixture.status === "scheduled" && <CountdownCell date={fixture.date} />}
      </span>
      <span className="flex min-w-0 items-center justify-end gap-2">
        <span className="truncate text-sm font-semibold text-[var(--text)]">
          {fixture.awayTeam.name}
        </span>
        <TeamCrest
          name={fixture.awayTeam.name}
          crestColor={fixture.awayTeam.crestColor}
          size={20}
        />
      </span>
    </button>
  );
}
