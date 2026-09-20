import { HeadToHeadMatch, TeamId } from "../types";
import { formatDateShort as formatDate } from "../dates";

interface Props {
  headToHead: HeadToHeadMatch[];
  teamA: TeamId;
  teamAName: string;
  teamBName: string;
}

/**
 * Recent meetings between the two clubs, framed from team A's perspective.
 * BSD has no head-to-head endpoint, so for most pairings this is empty — the
 * validation agent flags the gap and the UI states it plainly rather than
 * inventing fixtures.
 */
export function HeadToHeadPanel({ headToHead, teamA, teamAName, teamBName }: Props) {
  if (headToHead.length === 0) {
    return (
      <div className="tl-card p-5">
        <h2 className="tl-card-title">Head-to-Head</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No recent meetings on record for this pairing.
        </p>
      </div>
    );
  }

  return (
    <div className="tl-card p-5">
      <h2 className="tl-card-title">Head-to-Head</h2>
      <ul className="mt-2 tl-divide">
        {headToHead.map((m, i) => {
          const aHome = m.homeTeam === teamA;
          // The left team name is always the home side, so homeGoals is its
          // tally — bold whichever side won to make it obvious at a glance.
          const leftWon = m.homeGoals > m.awayGoals;
          const rightWon = m.awayGoals > m.homeGoals;

          return (
            <li key={i} className="flex items-baseline gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-2)]">
                <span style={{ fontWeight: leftWon ? 700 : 400, color: leftWon ? "var(--text)" : undefined }}>
                  {aHome ? teamAName : teamBName}
                </span>
                <span className="mx-1.5 font-bold tabular-nums text-[var(--text)]">
                  {m.homeGoals}–{m.awayGoals}
                </span>
                <span style={{ fontWeight: rightWon ? 700 : 400, color: rightWon ? "var(--text)" : undefined }}>
                  {aHome ? teamBName : teamAName}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-[var(--muted)]">
                {formatDate(m.date)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
