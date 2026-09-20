import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchStandings } from "../api/client";
import { formatDay as dayLabel } from "../dates";
import { CountryFlag } from "./CountryFlag";
import { LeagueSidebar } from "./LeagueSidebar";
import { MatchRow } from "./MatchRow";
import { TeamCrest } from "./TeamCrest";
import { usePinnedLeagues } from "../hooks/usePinnedLeagues";
import {
  Competition,
  Fixture,
  FixturesStatus,
  TeamSearchResult,
  TeamStats,
} from "../types";

interface Props {
  fixtures?: Fixture[];
  isFetching: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
  status: FixturesStatus;
  onStatusChange: (status: FixturesStatus) => void;
  competitions: Competition[];
  /** Empty string = all leagues. */
  competition: string;
  onCompetitionChange: (competition: string) => void;
  onNavigate: (fixture: Fixture) => void;
  onSelectTeam: (team: TeamSearchResult) => void;
  /** Event id of the row currently resolving standings slugs (pending feedback). */
  pendingEventId?: number | null;
}

const STATUSES: { id: FixturesStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "scheduled", label: "Scheduled" },
];

const EMPTY_COPY: Record<FixturesStatus, string> = {
  all: "No matches match these filters — try another league.",
  live: "No live matches right now — check Scheduled for what's next.",
  finished: "No finished matches under these filters yet.",
  scheduled: "Nothing scheduled under these filters — try another league.",
};

/** Split a list into date buckets; newest first for results, else soonest first. */
function groupByDate(fixtures: Fixture[], status: FixturesStatus) {
  const buckets = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = new Date(f.date).toDateString();
    const list = buckets.get(key) ?? [];
    list.push(f);
    buckets.set(key, list);
  }
  const order = (a: string, b: string) =>
    status === "finished"
      ? b.localeCompare(a)
      : a.localeCompare(b);
  return Array.from(buckets.entries())
    .sort(([a], [b]) => order(a, b))
    .map(([key, list]) => ({ date: key, fixtures: list }));
}

/**
 * Best active unbeaten run across a band's finished fixtures (finished
 * sections arrive newest-first, so the first 5 collected per team are its
 * latest). Returns null unless someone is unbeaten in 3+.
 */
function bandStreak(dates: { fixtures: Fixture[] }[]): { name: string; run: number } | null {
  const results = new Map<string, ("W" | "D" | "L")[]>();
  const names = new Map<string, string>();
  for (const d of dates) {
    for (const f of d.fixtures) {
      if (f.status !== "finished") continue;
      const hs = f.homeScore ?? 0;
      const as = f.awayScore ?? 0;
      const push = (id: string, name: string, r: "W" | "D" | "L") => {
        names.set(id, name);
        const arr = results.get(id) ?? [];
        if (arr.length < 5) arr.push(r);
        results.set(id, arr);
      };
      push(f.homeTeam.id, f.homeTeam.name, hs > as ? "W" : hs < as ? "L" : "D");
      push(f.awayTeam.id, f.awayTeam.name, as > hs ? "W" : as < hs ? "L" : "D");
    }
  }
  let best: { name: string; run: number } | null = null;
  for (const [id, arr] of results) {
    let run = 0;
    for (const r of arr) {
      if (r === "L") break;
      run++;
    }
    if (run >= 3 && (!best || run > best.run)) best = { name: names.get(id)!, run };
  }
  return best;
}

/** Arrow-key roving focus across a container's buttons (Tab still works). */
function arrowNav(e: KeyboardEvent<HTMLElement>, orientation: "vertical" | "horizontal") {
  const fwd = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
  const back = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
  if (e.key !== fwd && e.key !== back) return;
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
  );
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  if (i === -1) return;
  e.preventDefault();
  items[(i + (e.key === fwd ? 1 : -1) + items.length) % items.length].focus();
}

function DateSection({
  label,
  fixtures,
  onNavigate,
  pendingEventId,
  anchor,
}: {
  label: string;
  fixtures: Fixture[];
  onNavigate: (f: Fixture) => void;
  pendingEventId?: number | null;
  /** Scroll target id for the date stepper (undefined = not steppable). */
  anchor?: string;
}) {
  return (
    <div id={anchor} className="scroll-mt-24">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </h3>
      <div className="mt-1.5 space-y-1" onKeyDown={(e) => arrowNav(e, "vertical")}>
        {fixtures.map((f) => (
          <MatchRow
            key={f.eventId}
            fixture={f}
            pending={pendingEventId === f.eventId}
            onClick={() => onNavigate(f)}
          />
        ))}
      </div>
    </div>
  );
}

/** Pinned-season table for a league band: pos, record, goals, points. */
function StandingsTable({ rows, competition }: { rows: TeamStats[]; competition: string }) {
  const pts = (t: TeamStats) => t.wins * 3 + t.draws;
  if (rows.length === 0) {
    return (
      <p className="px-1 py-3 text-center text-sm text-[var(--muted)]">
        No standings for this competition yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-[var(--muted)]">
            <th scope="col" className="w-8 px-2 py-1 text-right font-semibold">#</th>
            <th scope="col" className="px-2 py-1 text-left font-semibold">Team</th>
            {(["P", "W", "D", "L", "GD", "Pts"] as const).map((h) => (
              <th key={h} scope="col" className="px-1.5 py-1 text-center font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const gd = t.goalsFor - t.goalsAgainst;
            return (
              <tr key={t.teamId} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-2 py-1.5 text-right tabular-nums text-[var(--muted)]">
                  {t.standingPosition}
                </td>
                <td className="max-w-44 px-2 py-1.5">
                  <span className="flex items-center gap-2">
                    <TeamCrest name={t.name} crestColor={t.crestColor} competition={competition} size={18} />
                    <span className="truncate font-semibold text-[var(--text)]">{t.name}</span>
                  </span>
                </td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-[var(--text-2)]">{t.played}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-[var(--text-2)]">{t.wins}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-[var(--text-2)]">{t.draws}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-[var(--text-2)]">{t.losses}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-[var(--text-2)]">
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="px-1.5 py-1.5 text-center font-bold tabular-nums text-[var(--text)]">
                  {pts(t)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FixturesView({
  fixtures,
  isFetching,
  isError,
  error,
  onRetry,
  status,
  onStatusChange,
  competitions,
  competition,
  onCompetitionChange,
  onNavigate,
  onSelectTeam,
  pendingEventId,
}: Props) {
  // All leagues -> group by league, then date; one league -> date sections only.
  // Overview ranks live-now leagues first, then leagues with matches today,
  // then the rest by country — no counts, per the §8o decision.
  const groups = useMemo(() => {
    if (!fixtures) return [];
    if (competition) {
      return [
        {
          key: competition,
          name: competitions.find((c) => c.id === competition)?.name ?? "",
          country: competitions.find((c) => c.id === competition)?.country ?? "",
          dates: groupByDate(fixtures, status),
        },
      ];
    }
    const today = new Date().toDateString();
    const tier = (dates: { fixtures: Fixture[] }[]) => {
      if (dates.some((d) => d.fixtures.some((f) => f.status === "live"))) return 0;
      if (
        dates.some((d) =>
          d.fixtures.some((f) => f.status === "scheduled" && new Date(f.date).toDateString() === today)
        )
      )
        return 1;
      return 2;
    };
    const byLeague = new Map<string, Fixture[]>();
    for (const f of fixtures) {
      const list = byLeague.get(f.competition) ?? [];
      list.push(f);
      byLeague.set(f.competition, list);
    }
    return Array.from(byLeague.entries())
      .map(([id, list]) => {
        const comp = competitions.find((c) => c.id === id);
        return {
          key: id,
          name: comp?.name ?? list[0]?.competitionName ?? id,
          country: comp?.country ?? list[0]?.country ?? "",
          dates: groupByDate(list, status),
        };
      })
      .sort(
        (a, b) =>
          tier(a.dates) - tier(b.dates) ||
          a.country.localeCompare(b.country) ||
          a.name.localeCompare(b.name)
      );
  }, [fixtures, competition, competitions, status]);

  // One league model for sidebar and chips: pinned-first ordering lives
  // here, both surfaces render from it — a pin on desktop reorders mobile.
  const [pinned, togglePin] = usePinnedLeagues();
  const orderedCompetitions = useMemo(() => {
    const set = new Set(pinned);
    return [
      ...competitions.filter((c) => set.has(c.id)),
      ...competitions.filter((c) => !set.has(c.id)),
    ];
  }, [competitions, pinned]);

  const leagues = [
    { id: "", name: "All leagues", country: "" },
    ...orderedCompetitions.map((c) => ({ id: c.id, name: c.name, country: c.country })),
  ];

  // Bands page matches in batches of PAGE_SIZE; each Show more click
  // reveals the next batch, Show fewer resets to the first.
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});
  const budget = (key: string) => visibleCount[key] ?? PAGE_SIZE;
  function showMore(key: string) {
    setVisibleCount((prev) => ({ ...prev, [key]: budget(key) + PAGE_SIZE }));
  }
  function showFewer(key: string) {
    setVisibleCount((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Visible date sections per band: first budget(matches) in display order,
  // sections never split empty. `hidden` counts what's behind Show more.
  const visibleGroups = useMemo(
    () =>
      groups.map((g) => {
        const total = g.dates.reduce((n, d) => n + d.fixtures.length, 0);
        const limit = visibleCount[g.key] ?? PAGE_SIZE;
        let shown = 0;
        const dates = [];
        for (const d of g.dates) {
          if (shown >= limit) break;
          const slice = d.fixtures.slice(0, limit - shown);
          dates.push({ date: d.date, fixtures: slice });
          shown += slice.length;
        }
        return { ...g, total, hidden: total - shown, dates, streak: bandStreak(g.dates) };
      }),
    [groups, visibleCount]
  );

  // Hero onboarding shows for first visits without data; once fixtures
  // exist it collapses to the one-liner (manual Hide persists, Intro
  // reopens for the session).
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("pitchiq:hero-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [forceOpen, setForceOpen] = useState(false);
  function setHero(open: boolean) {
    setForceOpen(open);
    setDismissed(!open);
    try {
      localStorage.setItem("pitchiq:hero-collapsed", open ? "0" : "1");
    } catch {
      // Private mode etc. — the hero just doesn't stay collapsed.
    }
  }
  const showHero =
    forceOpen || (!dismissed && (!fixtures || fixtures.length === 0 || isError));
  // Collapsed league bands — session-only, so a revisit never hides matches.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  function toggleCollapse(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Distinct days in the visible sections, in display order — the stepper
  // walks these and scrolls to each date section. Buckets are single days,
  // so ordering by first kickoff orders the days.
  const days = useMemo(() => {
    const firstSeen = new Map<string, string>();
    for (const g of visibleGroups) {
      for (const d of g.dates) {
        for (const f of d.fixtures) {
          const key = new Date(f.date).toDateString();
          if (!firstSeen.has(key)) firstSeen.set(key, f.date);
        }
      }
    }
    const keys = [...firstSeen.keys()];
    const time = (k: string) => new Date(firstSeen.get(k)!).getTime();
    keys.sort((a, b) => (status === "finished" ? time(b) - time(a) : time(a) - time(b)));
    return keys.map((key) => ({ key, iso: firstSeen.get(key)! }));
  }, [visibleGroups, status]);
  const dayIndex = useMemo(() => new Map(days.map((d, i) => [d.key, i])), [days]);
  const [dayIdx, setDayIdx] = useState(0);
  useEffect(() => {
    setDayIdx(0);
    setVisibleCount({});
  }, [competition, status]);

  // Sliding active-pill backdrop: measured off the active button so the
  // green highlight glides between pills instead of snapping.
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });
  function measureIndicator() {
    const el = btnRefs.current[STATUSES.findIndex((s) => s.id === status)];
    if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
  }
  // Pre-paint, so first paint already sits under the active pill (no glide in).
  useLayoutEffect(measureIndicator, [status]);
  useEffect(() => {
    const ro = new ResizeObserver(() => measureIndicator());
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);
  const safeIdx = days.length === 0 ? 0 : Math.min(dayIdx, days.length - 1);
  function stepTo(i: number) {
    setDayIdx(i);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(`fixtures-day-${i}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  // Survive interruption (reload, tab switch): restore the stepped-to day by
  // stable date key — not index, the list shifts as fixtures update — and the
  // scroll offset. Session-scoped; each restores once so later refetches
  // never yank the viewport.
  const restoredDayRef = useRef(false);
  const restoredScrollRef = useRef(false);
  useEffect(() => {
    if (days.length === 0 || restoredDayRef.current) return;
    restoredDayRef.current = true;
    let key: string | null = null;
    try {
      key = sessionStorage.getItem("pitchiq:fixtures-day");
    } catch {
      // Private mode — start at the default day.
    }
    const i = key ? days.findIndex((d) => d.key === key) : 0;
    if (i > 0) {
      setDayIdx(i);
      document.getElementById(`fixtures-day-${i}`)?.scrollIntoView({ block: "start" });
    }
  }, [days]);
  useEffect(() => {
    if (days.length === 0) return;
    try {
      sessionStorage.setItem("pitchiq:fixtures-day", days[safeIdx].key);
    } catch {
      // Private mode — the day just doesn't persist.
    }
  }, [days, safeIdx]);
  useEffect(() => {
    if (!fixtures || restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    let y = 0;
    try {
      y = Number(sessionStorage.getItem("pitchiq:fixtures-scroll") ?? 0);
    } catch {
      // Private mode — start at top.
    }
    if (y > 0) window.scrollTo(0, y);
  }, [fixtures]);
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem("pitchiq:fixtures-scroll", String(window.scrollY));
      } catch {
        // Private mode — scroll just doesn't persist.
      }
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  // Standings tables, fetched once per competition when its focused band
  // is open (including on first render — bands start expanded, so there is
  // no open-transition to hook the fetch onto). A band showing the section
  // without cached rows is loading.
  const [tables, setTables] = useState<Record<string, TeamStats[]>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!competition || collapsed.has(competition)) return;
    if (tables[competition] || tableErrors[competition]) return;
    fetchStandings(competition).then(
      (rows) => setTables((prev) => ({ ...prev, [competition]: rows })),
      (err) => setTableErrors((prev) => ({ ...prev, [competition]: (err as Error).message }))
    );
  }, [competition, collapsed, tables, tableErrors]);

  return (
    <div className="space-y-5">
      {showHero ? (
      <section className="tl-card tl-reveal p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text)]">
            Pick a match. Get a data-backed prediction.
          </h1>
          <button
            type="button"
            onClick={() => setHero(false)}
            aria-label="Hide introduction"
            title="Hide introduction"
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            Hide ▲
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Form, xG, head-to-head and predicted lineups — insight to guide your prediction.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Coloured initials stand in for club badges · the countdown is time to
          kickoff · tap any row to compare the two clubs.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["1", "Pick a match", "Tap any fixture below"],
            ["2", "Compare the clubs", "Stats, H2H, injuries, lineups"],
            ["3", "Read the insight", "AI verdict on the matchup"],
          ].map(([n, title, sub]) => (
            <li
              key={n}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-2)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
              >
                {n}
              </span>
              <span>
                <span className="block text-sm font-bold text-[var(--text)]">{title}</span>
                <span className="block text-xs text-[var(--muted)]">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      ) : (
        <section
          aria-label="Introduction (collapsed)"
          className="tl-card flex items-center gap-3 px-4 py-2.5"
        >
          <span className="truncate text-sm text-[var(--muted)]">
            <strong className="font-bold text-[var(--text)]">PitchIQ</strong>
            {" — pick a match for a data-backed prediction."}
          </span>
          <button
            type="button"
            onClick={() => setHero(true)}
            aria-label="Show introduction"
            className="ml-auto shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            Intro ▼
          </button>
        </section>
      )}
      <div className="flex items-start gap-5">
        <LeagueSidebar
          competitions={orderedCompetitions}
          competition={competition}
          pinned={pinned}
          onCompetitionChange={onCompetitionChange}
          onTogglePin={togglePin}
          onSelectTeam={onSelectTeam}
        />
        <div className="min-w-0 flex-1 space-y-5">
      <div className="tl-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div ref={trackRef} className="relative inline-flex gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} role="group" aria-label="Match status" onKeyDown={(e) => arrowNav(e, "horizontal")}>
          <span
            aria-hidden="true"
            className="tl-slide-indicator absolute bottom-1 left-0 top-1 rounded-lg"
            style={{
              background: "var(--brand)",
              width: indicator.w,
              transform: `translateX(${indicator.x}px)`,
            }}
          />
          {STATUSES.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              onClick={() => onStatusChange(s.id)}
              aria-pressed={status === s.id}
              className="relative z-10 rounded-lg px-4 py-1.5 text-sm font-bold transition"
              style={
                status === s.id
                  ? { color: "var(--brand-ink)" }
                  : { color: "var(--text-2)" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        {days.length > 1 && (
          <div className="flex items-center gap-1" role="group" aria-label="Jump to day">
            <button
              type="button"
              onClick={() => stepTo(safeIdx - 1)}
              disabled={safeIdx === 0}
              aria-label="Previous day"
              title="Previous day"
              className="rounded-lg px-2 py-1 text-sm font-bold text-[var(--text-2)] transition hover:bg-[var(--surface-2)] disabled:opacity-40"
            >
              ‹
            </button>
            <span aria-live="polite" className="min-w-24 text-center text-sm font-bold text-[var(--text)]">
              {dayLabel(days[safeIdx].iso)}
            </span>
            <button
              type="button"
              onClick={() => stepTo(safeIdx + 1)}
              disabled={safeIdx === days.length - 1}
              aria-label="Next day"
              title="Next day"
              className="rounded-lg px-2 py-1 text-sm font-bold text-[var(--text-2)] transition hover:bg-[var(--surface-2)] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}
        </div>
        <div className="mt-4 space-y-2.5 lg:hidden">
          <div aria-hidden="true" style={{ borderTop: "1px solid var(--border)" }} />
          <span className="tl-card-title block">League</span>
          <div
            className="league-chips flex min-w-0 gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Competitions"
            onKeyDown={(e) => arrowNav(e, "horizontal")}
          >
            {leagues.map((l) => {
              const active = competition === l.id;
              return (
                <button
                  key={l.id || "all"}
                  type="button"
                  onClick={() => onCompetitionChange(l.id)}
                  aria-pressed={active}
                  title={l.id ? `Show ${l.name} matches` : "Show matches from all leagues"}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition"
                  style={
                    active
                      ? {
                          background: "var(--brand)",
                          borderColor: "var(--brand)",
                          color: "var(--brand-ink)",
                        }
                      : {
                          background: "var(--surface-2)",
                          borderColor: "var(--border)",
                          color: "var(--text-2)",
                        }
                  }
                >
                  {l.country ? <CountryFlag country={l.country} width={18} /> : null}
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isError && (
        <div className="tl-card flex items-center justify-between gap-3 p-4 text-sm" style={{ color: "var(--loss)" }}>
          <span>Couldn't load fixtures: {error?.message}</span>
          <button
            className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}

      {isFetching && !fixtures && (
        <div className="tl-card space-y-2 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="tl-skeleton h-9" style={{ width: `${92 - i * 8}%` }} />
          ))}
        </div>
      )}

      {!isError && fixtures && fixtures.length === 0 && (
        <div className="tl-card p-5 text-sm text-[var(--muted)]">
          {EMPTY_COPY[status]}
        </div>
      )}

      {!isError && fixtures && fixtures.length > 0 && (
        <div className="space-y-6">
          {visibleGroups.map((league) => {
            const shut = collapsed.has(league.key);
            // The standings table stacks below the matches only in the
            // focused league view — in the overview it would repeat in all
            // 11 bands and fetch 11 tables.
            const focused = Boolean(competition);
            const fullyShown = league.hidden === 0 && league.total > PAGE_SIZE;
            return (
              <section key={league.key} aria-label={league.name}>
                <button
                  type="button"
                  onClick={() => toggleCollapse(league.key)}
                  aria-expanded={!shut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-[var(--surface-3)]"
                  style={{ background: "var(--surface-2)" }}
                >
                  <CountryFlag country={league.country} />
                  <span className="truncate text-sm font-bold text-[var(--text)]">
                    {league.name}
                  </span>
                  {league.streak && (
                    <span
                      className="hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-flex"
                      style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
                    >
                      {league.streak.name} unbeaten in {league.streak.run}
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`ml-auto shrink-0 text-[var(--muted)] transition ${shut ? "" : "rotate-180"}`}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {!shut && (
                  <div className="mt-2 space-y-4">
                    {league.dates.map((d) => (
                      <DateSection
                        key={d.date}
                        label={dayLabel(d.fixtures[0].date)}
                        fixtures={d.fixtures}
                        onNavigate={onNavigate}
                        pendingEventId={pendingEventId}
                        anchor={
                          dayIndex.get(d.date) === undefined
                            ? undefined
                            : `fixtures-day-${dayIndex.get(d.date)}`
                        }
                      />
                    ))}
                    {(league.hidden > 0 || fullyShown) && (
                      <button
                        type="button"
                        onClick={() =>
                          league.hidden > 0 ? showMore(league.key) : showFewer(league.key)
                        }
                        aria-expanded={league.hidden === 0}
                        className="w-full rounded-lg border px-3 py-1.5 text-sm font-bold transition hover:bg-[var(--surface-2)]"
                        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
                      >
                        {league.hidden > 0
                          ? `Show more matches (${league.hidden} more)`
                          : "Show fewer matches"}
                      </button>
                    )}
                    {focused && (
                      <div>
                        <span className="tl-card-title block px-1">Standings</span>
                        <div className="mt-1.5">
                          {tables[league.key] ? (
                            <StandingsTable rows={tables[league.key]} competition={league.key} />
                          ) : tableErrors[league.key] ? (
                            <p className="px-1 py-3 text-center text-sm" style={{ color: "var(--loss)" }}>
                              Couldn't load the table: {tableErrors[league.key]}
                            </p>
                          ) : (
                            <div className="space-y-2 py-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} className="tl-skeleton h-7" style={{ width: `${96 - i * 6}%` }} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
