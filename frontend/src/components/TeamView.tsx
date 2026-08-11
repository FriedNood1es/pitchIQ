import { useMemo } from "react";
import { CountryFlag } from "./CountryFlag";
import { MatchRow } from "./MatchRow";
import { PreviewPanel } from "./PreviewPanel";
import { TeamCrest } from "./TeamCrest";
import { TeamStatsPanel } from "./TeamStatsPanel";
import { useFixtures } from "../hooks/useFixtures";
import { usePreview } from "../hooks/usePreview";
import { useTeamStats } from "../hooks/useTeamStats";
import { Fixture, TeamId } from "../types";

interface Props {
  competition: string;
  /** Preview slug — the identity used by the fixtures/preview endpoints. */
  team: TeamId;
  competitionName: string;
  country: string;
  onBack: () => void;
  onNavigate: (fixture: Fixture) => void;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function MatchList({ fixtures, onNavigate }: { fixtures: Fixture[]; onNavigate: (f: Fixture) => void }) {
  return (
    <div className="space-y-1">
      {fixtures.map((f) => (
        <div key={f.eventId}>
          <div className="px-1 pb-1 pt-2 text-xs font-medium text-[var(--muted)]">
            {dayLabel(f.date)}
          </div>
          <MatchRow fixture={f} onClick={() => onNavigate(f)} />
        </div>
      ))}
    </div>
  );
}

/**
 * Team dashboard: search a club -> its predicted lineups, season stats and
 * fixtures. The team's display identity (monogram, proper name) is resolved
 * from its fixtures; the preview slug stays the routing identity throughout.
 */
export function TeamView({
  competition,
  team,
  competitionName,
  country,
  onBack,
  onNavigate,
}: Props) {
  const {
    data: fixtures,
    isFetching: fixturesFetching,
    isError: fixturesError,
    error: fixturesErrorObj,
    refetch: refetchFixtures,
  } = useFixtures(competition, "all", true);

  const teamInfo = useMemo(() => {
    for (const f of fixtures ?? []) {
      if (f.homeTeam.id === team) return f.homeTeam;
      if (f.awayTeam.id === team) return f.awayTeam;
    }
    return undefined;
  }, [fixtures, team]);
  const name = teamInfo?.name ?? team;

  const { data: stats, isError: statsError, error: statsErrorObj, refetch: refetchStats } =
    useTeamStats(competition, name);
  const { data: preview, isFetching: previewFetching, error: previewError, refetch: refetchPreview } =
    usePreview(competition, team, true);

  const { recent, upcoming } = useMemo(() => {
    const matches = (fixtures ?? []).filter(
      (f) => f.homeTeam.id === team || f.awayTeam.id === team
    );
    return {
      recent: matches
        .filter((f) => f.status === "finished")
        .sort((a, b) => b.date.localeCompare(a.date)),
      upcoming: matches
        .filter((f) => f.status === "scheduled")
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [fixtures, team]);

  return (
    <div className="space-y-5">
      <div className="tl-card flex flex-wrap items-center gap-4 p-5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border px-2.5 py-1.5 text-sm font-bold text-[var(--text-2)] transition hover:text-[var(--text)]"
          style={{ borderColor: "var(--border)" }}
        >
          ← Fixtures
        </button>
        <div className="flex items-center gap-3">
          <TeamCrest
            name={teamInfo?.name ?? name}
            crestColor={teamInfo?.crestColor ?? "var(--surface-3)"}
            size={44}
          />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text)]">
              {teamInfo?.name ?? name}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <CountryFlag country={country} width={18} />
              {competitionName}
            </div>
          </div>
        </div>
      </div>

      <PreviewPanel
        report={preview}
        isFetching={previewFetching}
        error={previewError}
        onRetry={() => refetchPreview()}
      />

      {statsError && (
        <div className="tl-card flex items-center justify-between gap-3 p-4 text-sm" style={{ color: "var(--loss)" }}>
          <span>Couldn't load stats: {statsErrorObj?.message}</span>
          <button
            className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
            onClick={() => refetchStats()}
          >
            Retry
          </button>
        </div>
      )}
      {stats && <TeamStatsPanel stats={stats} />}

      <div className="tl-card p-5">
        <h2 className="tl-card-title">Matches</h2>
        {fixturesError && (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm" style={{ color: "var(--loss)" }}>
            <span>Couldn't load fixtures: {fixturesErrorObj?.message}</span>
            <button
              className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
              style={{ background: "var(--surface-3)", color: "var(--text)" }}
              onClick={() => refetchFixtures()}
            >
              Retry
            </button>
          </div>
        )}
        {!fixturesError && fixturesFetching && !fixtures && (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="tl-skeleton h-9" style={{ width: `${92 - i * 8}%` }} />
            ))}
          </div>
        )}
        {!fixturesError && fixtures && recent.length === 0 && upcoming.length === 0 && (
          <p className="mt-3 text-sm text-[var(--muted)]">No recent or upcoming matches found.</p>
        )}
        {recent.length > 0 && (
          <div className="mt-3">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Recent
            </h3>
            <div className="mt-1.5">
              <MatchList fixtures={recent} onNavigate={onNavigate} />
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="mt-4">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Upcoming
            </h3>
            <div className="mt-1.5">
              <MatchList fixtures={upcoming} onNavigate={onNavigate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
