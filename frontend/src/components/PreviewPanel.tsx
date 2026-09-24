import { useEffect, useRef, useState } from "react";
import { Lineup, PreviewReport, TeamPreview } from "../types";
import { formatDateTime as formatDate } from "../dates";
import { LineupSide } from "./LineupPanel";

interface Props {
  report?: PreviewReport;
  isFetching: boolean;
  error?: Error | null;
  onRetry: () => void;
  /** Which side is the dashboard's own club — it leads, the other folds away. */
  ownSide?: "home" | "away" | null;
  /** Own club's brand color for the accent (hex only). */
  ownColor?: string;
}

function toLineup(preview?: TeamPreview): Lineup | undefined {
  if (!preview || preview.starters.length === 0) return undefined;
  return {
    formation: preview.formation,
    confidence: preview.confidence,
    confirmed: false,
    startingXI: preview.starters.map((s) => ({
      name: s.name,
      position: s.position,
      jerseyNumber: s.jerseyNumber,
      aiScore: s.aiScore,
    })),
    substitutes: [],
  };
}

/** Elapsed seconds since mount — the "still working, not stuck" hint. */
function useElapsed(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    if (!active) return;
    start.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - start.current) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [active]);
  return elapsed;
}

export function PreviewPanel({ report, isFetching, error, onRetry, ownSide, ownColor }: Props) {
  const elapsed = useElapsed(isFetching);

  if (isFetching && !report) {
    return (
      <div className="tl-card p-5">
        <h2 className="tl-card-title">Predicted Lineups</h2>
        <div className="mt-4 flex items-center gap-3 text-sm text-[var(--muted)]">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }}
            aria-hidden="true"
          />
          Fetching predicted lineups...{elapsed > 1 && ` (${elapsed}s)`}
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="tl-card flex items-center justify-between gap-3 p-4 text-sm" style={{ color: "var(--loss)" }}>
        <span>{error.message}</span>
        <button
          className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
          style={{ background: "var(--surface-3)", color: "var(--text)" }}
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report || (report.message && !report.event)) {
    return (
      <div className="tl-card p-5">
        <h2 className="tl-card-title">Predicted Lineups</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {report?.message ?? "No upcoming fixture selected."}
        </p>
      </div>
    );
  }

  const { event, home, away } = report;
  // Club-first order when the dashboard knows its own side; otherwise the
  // neutral home/away layout (compare never passes ownSide).
  const ordered =
    ownSide === "away"
      ? [{ side: away, own: true }, { side: home, own: false }]
      : ownSide === "home"
        ? [{ side: home, own: true }, { side: away, own: false }]
        : [{ side: home, own: false }, { side: away, own: false }];
  const clubFirst = ownSide === "home" || ownSide === "away";

  return (
    <div className="tl-card p-5">
      <h2 className="tl-card-title">Predicted Lineups</h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--text)]">{home.name}</span>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--brand)]">vs</div>
          <div className="text-xs text-[var(--muted)]">{event ? formatDate(event.date) : ""}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--text)]">{away.name}</span>
        </div>
      </div>

      {clubFirst ? (
        <div className="mt-3 space-y-4">
          {ordered
            .filter((o) => o.own)
            .map(({ side }) => (
              <div key={side.name}>
                <p className="mb-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide"
                    style={{ background: "var(--surface-3)", color: "var(--text)" }}
                  >
                    Your club
                  </span>
                </p>
                <div
                  className="rounded-xl"
                  style={ownColor ? { boxShadow: `inset 3px 0 0 ${ownColor}` } : undefined}
                >
                  <LineupSide teamName={side.name} lineup={toLineup(side)} injuries={[]} emptyLabel="No predicted lineup available." />
                </div>
              </div>
            ))}
          {ordered
            .filter((o) => !o.own)
            .map(({ side }) => (
              <details key={side.name}>
                <summary className="cursor-pointer select-none text-sm font-bold text-[var(--text-2)]">
                  {side.name} — predicted XI
                </summary>
                <div className="mt-2 opacity-90">
                  <LineupSide teamName={side.name} lineup={toLineup(side)} injuries={[]} emptyLabel="No predicted lineup available." />
                </div>
              </details>
            ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <LineupSide teamName={home.name} lineup={toLineup(home)} injuries={[]} emptyLabel="No predicted lineup available." />
          <LineupSide teamName={away.name} lineup={toLineup(away)} injuries={[]} emptyLabel="No predicted lineup available." />
        </div>
      )}
    </div>
  );
}
