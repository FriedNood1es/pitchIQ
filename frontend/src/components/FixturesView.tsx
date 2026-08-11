import { useMemo } from "react";
import { CountryFlag } from "./CountryFlag";
import { IconSelect } from "./IconSelect";
import { MatchRow } from "./MatchRow";
import { Competition, Fixture, FixturesStatus } from "../types";

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
}

const STATUSES: { id: FixturesStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "scheduled", label: "Scheduled" },
];

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

function DateSection({ label, fixtures, onNavigate }: { label: string; fixtures: Fixture[]; onNavigate: (f: Fixture) => void }) {
  return (
    <div>
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </h3>
      <div className="mt-1.5 space-y-1">
        {fixtures.map((f) => (
          <MatchRow key={f.eventId} fixture={f} onClick={() => onNavigate(f)} />
        ))}
      </div>
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
}: Props) {
  // All leagues -> group by league, then date; one league -> date sections only.
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures, competition, competitions, status]);

  const leagueOptions = [
    { id: "", label: "All leagues" },
    ...competitions.map((c) => ({
      id: c.id,
      label: c.name,
      icon: <CountryFlag country={c.country} />,
    })),
  ];

  return (
    <div className="space-y-5">
      <p className="px-1 text-sm text-[var(--muted)]">
        Pick any match to compare form, xG, head-to-head and predicted lineups — data-backed
        insight to guide your prediction.
      </p>
      <div className="tl-card flex flex-wrap items-center gap-3 p-3">
        <div className="flex rounded-lg border p-0.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStatusChange(s.id)}
              aria-pressed={status === s.id}
              className="rounded-md px-3 py-1 text-sm font-bold transition"
              style={
                status === s.id
                  ? { background: "var(--brand)", color: "var(--brand-ink)" }
                  : { color: "var(--text-2)" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        <IconSelect
          label="Competition"
          size="sm"
          className="w-48 sm:ml-auto"
          options={leagueOptions}
          value={competition}
          onChange={onCompetitionChange}
        />
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
          No matches match these filters.
        </div>
      )}

      {!isError && fixtures && fixtures.length > 0 && (
        <div className="space-y-6">
          {groups.map((league) => (
            <div key={league.key}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <CountryFlag country={league.country} />
                <h2 className="text-sm font-bold text-[var(--text)]">{league.name}</h2>
              </div>
              <div className="space-y-4">
                {league.dates.map((d) => (
                  <DateSection
                    key={d.date}
                    label={dayLabel(d.fixtures[0].date)}
                    fixtures={d.fixtures}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
