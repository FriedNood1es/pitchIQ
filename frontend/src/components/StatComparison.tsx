export interface StatRow {
  label: string;
  a: number;
  b: number;
  /** Text shown at each end (defaults to the rounded value). */
  displayA?: string;
  displayB?: string;
  /** Football-word gap, e.g. "Arsenal ahead by 8" (omitted when level). */
  delta?: string;
}

interface Props {
  rows: StatRow[];
  teamAName: string;
  teamBName: string;
}

function Row({ row }: { row: StatRow }) {
  // Magnitude-relative bars: each half scales against the row max, so 82 vs
  // 79 reads near-equal (true) while 71 vs 35 reads lopsided — share-of-total
  // bars showed both as ~50/50.
  const max = Math.max(row.a, row.b, 1);
  const aPct = (row.a / max) * 100;
  const bPct = (row.b / max) * 100;
  const aLeads = row.a > row.b;
  const bLeads = row.b > row.a;

  const valueClass = (leads: boolean) =>
    `text-sm tabular-nums ${leads ? "font-bold text-[var(--text)]" : "font-medium text-[var(--text-2)]"}`;

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={valueClass(aLeads)}>{row.displayA ?? Math.round(row.a)}</span>
        <span className="text-center">
          <span
            className="block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            title={row.label.includes("(est.)") ? "Estimated from points/game — no live possession feed" : undefined}
          >
            {row.label}
          </span>
          {row.delta && (
            <span className="block text-xs font-semibold tabular-nums text-[var(--text-2)]">
              {row.delta}
            </span>
          )}
        </span>
        <span className={valueClass(bLeads)}>{row.displayB ?? Math.round(row.b)}</span>
      </div>
      {/* magnitude fills growing from the centre, 2px surface gap between them */}
      <div className="flex h-2 gap-[2px]">
        <div className="flex-1 overflow-hidden rounded-l-full" style={{ background: "var(--surface-3)" }}>
          <div
            className="ml-auto h-full rounded-l-full"
            style={{ width: `${aPct}%`, background: "var(--team-a)", opacity: aLeads ? 1 : 0.55 }}
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-r-full" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-full rounded-r-full"
            style={{ width: `${bPct}%`, background: "var(--team-b)", opacity: bLeads ? 1 : 0.55 }}
          />
        </div>
      </div>
    </div>
  );
}

export function StatComparison({ rows, teamAName, teamBName }: Props) {
  return (
    <div className="tl-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="tl-card-title">Key Stats</h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-2)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--team-a)" }} />
            <span className="max-w-36 truncate sm:max-w-48" title={teamAName}>{teamAName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--team-b)" }} />
            <span className="max-w-36 truncate sm:max-w-48" title={teamBName}>{teamBName}</span>
          </span>
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => (
          <Row key={row.label} row={row} />
        ))}
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Attack/defense ratings run 0–100, higher is better.
        {rows.some((r) => r.label.includes("(est.)")) &&
          " Possession is estimated from points per game — no live feed."}
      </p>
    </div>
  );
}
