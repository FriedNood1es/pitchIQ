import { useEffect, useMemo, useRef, useState } from "react";
import { CountryFlag } from "./CountryFlag";
import { MatchRow } from "./MatchRow";
import { NewsColumn } from "./NewsList";
import { PreviewPanel } from "./PreviewPanel";
import { formatDay as dayLabel } from "../dates";
import { TeamCrest } from "./TeamCrest";
import { TeamStatsPanel } from "./TeamStatsPanel";
import { useFavoriteTeams } from "../hooks/useFavoriteTeams";
import { useFixtures } from "../hooks/useFixtures";
import { usePreview } from "../hooks/usePreview";
import { useTeamNews } from "../hooks/useTeamNews";
import { useTeamStats } from "../hooks/useTeamStats";
import { useNow } from "../hooks/useCountdown";
import { Fixture, TeamId, TeamSearchResult } from "../types";

interface Props {
  competition: string;
  /** Preview slug — the identity used by the fixtures/preview endpoints. */
  team: TeamId;
  competitionName: string;
  country: string;
  onBack: () => void;
  onNavigate: (fixture: Fixture) => void;
  onSelectTeam: (team: TeamSearchResult) => void;
}

function MatchList({
  fixtures,
  onNavigate,
  onSelectTeam,
}: {
  fixtures: Fixture[];
  onNavigate: (f: Fixture) => void;
  onSelectTeam: (team: TeamSearchResult) => void;
}) {
  const now = useNow(1000, fixtures.some((f) => f.status === "live"));
  // Consecutive fixtures sharing a day render under one header instead of
  // repeating the date on every row.
  const sections = useMemo(() => {
    const out: { day: string; items: Fixture[] }[] = [];
    for (const f of fixtures) {
      const day = dayLabel(f.date);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(f);
      else out.push({ day, items: [f] });
    }
    return out;
  }, [fixtures]);
  return (
    <div className="space-y-1">
      {sections.map((s) => (
        <div key={`${s.day}-${s.items[0].eventId}`}>
          <div className="px-1 pb-1 pt-2 text-xs font-medium text-[var(--muted)]">
            {s.day}
          </div>
          <div className="space-y-1">
            {s.items.map((f) => (
              <MatchRow
                key={f.eventId}
                fixture={f}
                now={now}
                onClick={() => onNavigate(f)}
                onSelectTeam={onSelectTeam}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Routing slug -> readable name for the fixture-failure fallback ("liverpool-fc" -> "Liverpool Fc"). */
function prettySlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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
  onSelectTeam,
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
  const displayName = teamInfo?.name ?? prettySlug(team);
  // Stats/news resolve by display name; fall back to the raw slug only until
  // fixtures load (the header already shows the prettified form).
  const name = teamInfo?.name ?? team;

  const { data: stats, isError: statsError, error: statsErrorObj, refetch: refetchStats } =
    useTeamStats(competition, name);
  const { data: preview, isFetching: previewFetching, error: previewError, refetch: refetchPreview } =
    usePreview(competition, team, true);
  // Same social feed as the compare report, single-team variant — an empty
  // feed renders as "No recent news"; a failed fetch gets its own retry card.
  const { data: news, isFetching: newsFetching, isError: newsError, refetch: refetchNews } =
    useTeamNews(competition, name);

  // Own side of the predicted-figures matchup, matched through the preview
  // event id — the panel leads with this club and folds the opponent away.
  const ownSide = useMemo(() => {
    const eid = preview?.event?.id;
    if (eid == null) return null;
    const match = (fixtures ?? []).find((f) => f.eventId === eid);
    if (!match) return null;
    return match.homeTeam.id === team ? ("home" as const) : ("away" as const);
  }, [preview, fixtures, team]);

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

  const [, toggleFavorite, isFavorite] = useFavoriteTeams();
  const starred = isFavorite(competition, team);

  // Favorite confirmations announce via the toast and clear on their own.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  function handleToggleFavorite() {
    const next = !starred;
    toggleFavorite({
      id: team,
      name: displayName,
      crestColor: teamInfo?.crestColor ?? "var(--surface-3)",
      competition,
      competitionName,
      country,
    });
    setToast(next ? `Added ${displayName} to My teams.` : `Removed ${displayName} from My teams.`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }

  // Club-color wash behind the hero — hex accents only, so the var() slate
  // fallback keeps the plain surface instead of an invalid gradient.
  const crest = teamInfo?.crestColor;
  const heroStyle =
    crest && crest.startsWith("#")
      ? { background: `linear-gradient(135deg, ${crest}2e 0%, transparent 55%), var(--surface)` }
      : undefined;

  return (
    <div className="space-y-5">
      <div className="tl-card p-5" style={heroStyle}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-[10px] border px-2.5 py-1.5 text-sm font-bold text-[var(--text-2)] transition hover:text-[var(--text)]"
            style={{ borderColor: "var(--border)" }}
          >
            ← Fixtures
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={starred}
            aria-label={starred ? `Remove ${displayName} from my teams` : `Add ${displayName} to my teams`}
            title={starred ? "Remove from my teams" : "Add to my teams"}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-sm font-bold transition hover:bg-[var(--surface-2)]"
            style={{
              borderColor: "var(--border)",
              color: starred ? "var(--brand)" : "var(--muted)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
            </svg>
            {starred ? "Saved" : "Save"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <TeamCrest
            name={displayName}
            crestColor={teamInfo?.crestColor ?? "var(--surface-3)"}
            competition={competition}
            size={60}
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
              {displayName}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <CountryFlag country={country} width={18} />
              {competitionName}
            </div>
          </div>
        </div>
        {toast && (
          <p role="status" className="mt-3 text-sm font-semibold text-[var(--text)]">
            {toast}
          </p>
        )}
      </div>

      <PreviewPanel
        report={preview}
        isFetching={previewFetching}
        error={previewError}
        onRetry={() => refetchPreview()}
        ownSide={ownSide}
        ownColor={crest?.startsWith("#") ? crest : undefined}
      />

      {statsError &&
        ((statsErrorObj as unknown as { status?: number })?.status === 404 ? (
          <div className="tl-card p-4 text-sm text-[var(--muted)]">
            No league-table stats for {displayName} in the {competitionName} yet —
            likely new to the competition this season. Predicted lineups and
            fixtures below use live data.
          </div>
        ) : (
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
        ))}
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
              <MatchList fixtures={recent} onNavigate={onNavigate} onSelectTeam={onSelectTeam} />
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="mt-4">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Upcoming
            </h3>
            <div className="mt-1.5">
              <MatchList fixtures={upcoming} onNavigate={onNavigate} onSelectTeam={onSelectTeam} />
            </div>
          </div>
        )}
      </div>

      <details className="tl-card px-5 py-4">
        <summary className="tl-card-title cursor-pointer select-none">
          Latest News
          {news && news.length > 0 && (
            <span className="font-extrabold tabular-nums"> ({news.length})</span>
          )}
        </summary>
        <div className="mt-3">
          {newsFetching && !news ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="tl-skeleton h-4" style={{ width: `${82 - i * 9}%` }} />
              ))}
            </div>
          ) : newsError && !news ? (
            <div className="flex items-center justify-between gap-3 text-sm" style={{ color: "var(--loss)" }}>
              <span>Couldn't load news.</span>
              <button
                className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
                style={{ background: "var(--surface-3)", color: "var(--text)" }}
                onClick={() => refetchNews()}
              >
                Retry
              </button>
            </div>
          ) : (
            <NewsColumn
              teamName={displayName}
              seriesColor={teamInfo?.crestColor ?? "var(--brand)"}
              items={news ?? []}
              showHeader={false}
            />
          )}
        </div>
      </details>
    </div>
  );
}
