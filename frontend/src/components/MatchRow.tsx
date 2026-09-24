import { Fixture, FixtureTeam, TeamSearchResult } from "../types";
import { formatCountdown, useCountdown } from "../hooks/useCountdown";
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

/** LIVE badge + elapsed minute for the time column (scores sit on each team line).
 * `now` comes from the list's shared clock — pure math here, no interval. */
function LiveCell({ date, now }: { date: string; now: number }) {
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

/**
 * One team line: monogram + name, with a right-aligned score once played/live.
 * The name is its own button opening the club's dashboard (its preview slug
 * rides on the fixture team, so no standings lookup is needed) — independent
 * of the row's compare action, so no stopPropagation hacks.
 */
function TeamLine({
  name,
  crestColor,
  competition,
  score,
  onOpenTeam,
}: {
  name: string;
  crestColor: string;
  competition: string;
  score?: number;
  onOpenTeam: () => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamCrest name={name} crestColor={crestColor} competition={competition} size={20} />
      <button
        type="button"
        onClick={onOpenTeam}
        title={`Open ${name} dashboard`}
        aria-label={`Open ${name} dashboard`}
        className="truncate rounded text-sm font-semibold text-[var(--text)] transition hover:text-[var(--brand)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
      >
        {name}
      </button>
      {score !== undefined && (
        <span className="ml-auto pl-3 font-bold tabular-nums text-[var(--text)]">
          {score}
        </span>
      )}
    </span>
  );
}

/**
 * One fixture row: time column, home-over-away lines, compare button —
 * shared between the fixtures landing and the team dashboard. The row is a
 * plain container: each team name is a real button (dashboard) and the
 * trailing action is a real button (compare), so assistive tech meets three
 * native controls instead of a link nested in a button.
 */
export function MatchRow({
  fixture,
  onClick,
  onSelectTeam,
  pending,
  now,
}: {
  fixture: Fixture;
  onClick: () => void;
  /** Open a club's dashboard — the result is built from the fixture itself. */
  onSelectTeam: (team: TeamSearchResult) => void;
  /** True while the click is resolving standings slugs — blocks double-taps. */
  pending?: boolean;
  /** Shared list clock (epoch ms) for the live elapsed cell. */
  now: number;
}) {
  // Dashboard identity comes straight off the fixture: preview slug + the
  // competition meta the TeamSearchResult needs all ride along already.
  function openTeam(side: FixtureTeam) {
    onSelectTeam({
      id: side.id,
      name: side.name,
      crestColor: side.crestColor,
      competition: fixture.competition,
      competitionName: fixture.competitionName,
      country: fixture.country,
    });
  }
  // Finished rows are NOT dimmed: opacity reads as disabled. The FT label
  // + per-line scores in the time column already separate them.
  const scored = fixture.status === "finished" || fixture.status === "live";
  const compareLabel = `Compare ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} — stats, head-to-head and prediction`;
  return (
    <div className="grid min-h-[48px] w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-2)]">

      <span className="flex w-[3.5rem] flex-col items-start justify-center gap-0.5 text-sm">
        {fixture.status === "finished" && (
          <>
            <span className="text-xs font-bold tabular-nums text-[var(--muted)]">FT</span>
            <span className="text-xs tabular-nums text-[var(--muted)]">{kickoff(fixture.date)}</span>
          </>
        )}
        {fixture.status === "live" && <LiveCell date={fixture.date} now={now} />}
        {fixture.status === "scheduled" && <CountdownCell date={fixture.date} />}
      </span>
      <span className="flex min-w-0 flex-col justify-center gap-0.5 py-0.5">
        <TeamLine
          name={fixture.homeTeam.name}
          crestColor={fixture.homeTeam.crestColor}
          competition={fixture.competition}
          score={scored ? fixture.homeScore ?? 0 : undefined}
          onOpenTeam={() => openTeam(fixture.homeTeam)}
        />
        <TeamLine
          name={fixture.awayTeam.name}
          crestColor={fixture.awayTeam.crestColor}
          competition={fixture.competition}
          score={scored ? fixture.awayScore ?? 0 : undefined}
          onOpenTeam={() => openTeam(fixture.awayTeam)}
        />
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending ? "true" : undefined}
        aria-label={compareLabel}
        title={pending ? "Loading comparison…" : compareLabel}
        className="flex min-h-[44px] shrink-0 items-center rounded-lg px-1 text-xs font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
      >
        {pending ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
        ) : (
          <span aria-hidden="true">Compare&nbsp;›</span>
        )}
      </button>
    </div>
  );
}
