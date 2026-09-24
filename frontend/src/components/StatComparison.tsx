import { TeamId } from "../types";
import { TeamName } from "./TeamName";

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
  teamAId: TeamId;
  teamBId: TeamId;
  /** Open a club's dashboard from a legend name. */
  onOpenTeam: (name: string, standingsId: TeamId) => void;
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
  const trailOpacity = 0.75;

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
      {/* magnitude fills growing from the centre, 2px surface gap between them.
          Decorative: values already read as text above, so hide from AT. */}
      <div className="flex h-2 gap-[2px]" aria-hidden="true">
        <div className="flex-1 overflow-hidden rounded-l-full" style={{ background: "var(--surface-3)" }}>
          <div
            className="ml-auto h-full rounded-l-full"
            style={{ width: `${aPct}%`, background: "var(--team-a)", opacity: aLeads ? 1 : trailOpacity }}
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-r-full" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-full rounded-r-full"
            style={{ width: `${bPct}%`, background: "var(--team-b)", opacity: bLeads ? 1 : trailOpacity }}
          />
        </div>
      </div>
    </div>
  );
}

export function StatComparison({ rows, teamAName, teamBName, teamAId, teamBId, onOpenTeam }: Props) {
  return (
    <div className="tl-card overflow-x-auto p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="tl-card-title">Key Stats</h2>
        <div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-2)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--team-a)" }} />
            <TeamName
              onOpen={() => onOpenTeam(teamAName, teamAId)}
              title={`${teamAName} — open team dashboard`}
              className="max-w-32 truncate sm:max-w-40"
            >
              {teamAName}
            </TeamName>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--team-b)" }} />
            <TeamName
              onOpen={() => onOpenTeam(teamBName, teamBId)}
              title={`${teamBName} — open team dashboard`}
              className="max-w-32 truncate sm:max-w-40"
            >
              {teamBName}
            </TeamName>
          </span>
        </div>
      </div>
      <div className="tl-divide">
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
