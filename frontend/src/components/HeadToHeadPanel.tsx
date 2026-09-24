import { HeadToHeadMatch, H2hAggregates, TeamId } from "../types";
import { formatDateShort as formatDate } from "../dates";
import { TeamName } from "./TeamName";

interface Props {
  headToHead: HeadToHeadMatch[];
  aggregates?: H2hAggregates;
  teamA: TeamId;
  teamB: TeamId;
  teamAName: string;
  teamBName: string;
  /** Open a club's dashboard from a meeting row (names carry no slug). */
  onOpenTeam: (name: string, standingsId: TeamId) => void;
}

/**
 * Recent meetings between the two clubs, framed from team A's perspective.
 * BSD has no head-to-head endpoint, so for most pairings this is empty — the
 * validation agent flags the gap and the UI states it plainly rather than
 * inventing fixtures.
 */
export function HeadToHeadPanel({ headToHead, aggregates, teamA, teamB, teamAName, teamBName, onOpenTeam }: Props) {
  if (headToHead.length === 0) {
    return (
      <div className="tl-card h-full p-5">
        <h2 className="tl-card-title">Head-to-Head</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No recent meetings on record for this pairing.
        </p>
      </div>
    );
  }

  return (
    <div className="tl-card h-full p-5">
      <h2 className="tl-card-title">Head-to-Head</h2>
      {aggregates && aggregates.totalMatches > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          {aggregates.totalMatches} meetings · {teamAName} {aggregates.winRateA}% · Draw{" "}
          {aggregates.drawRate}% · {teamBName} {aggregates.winRateB}% ·{" "}
          {aggregates.avgTotalGoals} goals/game
        </p>
      )}
      <ul className="mt-2 tl-divide">
        {headToHead.map((m, i) => {
          const aHome = m.homeTeam === teamA;
          // The left team name is always the home side, so homeGoals is its
          // tally — bold whichever side won to make it obvious at a glance.
          const leftWon = m.homeGoals > m.awayGoals;
          const rightWon = m.awayGoals > m.homeGoals;
          const left = aHome
            ? { name: teamAName, id: teamA }
            : { name: teamBName, id: teamB };
          const right = aHome
            ? { name: teamBName, id: teamB }
            : { name: teamAName, id: teamA };

          return (
            <li key={i} className="flex items-baseline gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-2)]">
                <TeamName
                  onOpen={() => onOpenTeam(left.name, left.id)}
                  className={leftWon ? "font-bold text-[var(--text)]" : ""}
                >
                  {left.name}
                </TeamName>
                <span className="mx-1.5 font-bold tabular-nums text-[var(--text)]">
                  {m.homeGoals}–{m.awayGoals}
                </span>
                <TeamName
                  onOpen={() => onOpenTeam(right.name, right.id)}
                  className={rightWon ? "font-bold text-[var(--text)]" : ""}
                >
                  {right.name}
                </TeamName>
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
