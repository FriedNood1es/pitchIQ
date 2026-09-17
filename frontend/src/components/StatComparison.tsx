export interface StatRow {
  label: string;
  a: number;
  b: number;
  /** Text shown at each end (defaults to the rounded value). */
  displayA?: string;
  displayB?: string;
}

interface Props {
  rows: StatRow[];
  teamAName: string;
  teamBName: string;
}

function Row({ row }: { row: StatRow }) {
  const total = row.a + row.b;
  const aPct = total > 0 ? (row.a / total) * 100 : 50;
  const bPct = 100 - aPct;
  const aLeads = row.a > row.b;
  const bLeads = row.b > row.a;

  const valueClass = (leads: boolean) =>
    `text-sm tabular-nums ${leads ? "font-bold text-[var(--text)]" : "font-medium text-[var(--text-2)]"}`;

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={valueClass(aLeads)}>{row.displayA ?? Math.round(row.a)}</span>
        <span
          className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
          title={row.label.includes("(est.)") ? "Estimated from points/game — no live possession feed" : undefined}
        >
          {row.label}
        </span>
        <span className={valueClass(bLeads)}>{row.displayB ?? Math.round(row.b)}</span>
      </div>
      {/* two fills growing from the centre, 2px surface gap between them */}
      <div className="flex h-2 gap-[2px]">
        <div
          className="rounded-l-full"
          style={{ flex: `0 0 ${aPct}%`, background: "var(--team-a)", opacity: aLeads ? 1 : 0.55 }}
        />
        <div
          className="rounded-r-full"
          style={{ flex: `0 0 ${bPct}%`, background: "var(--team-b)", opacity: bLeads ? 1 : 0.55 }}
        />
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
            <span className="max-w-28 truncate" title={teamAName}>{teamAName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--team-b)" }} />
            <span className="max-w-28 truncate" title={teamBName}>{teamBName}</span>
          </span>
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((row) => (
          <Row key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}
