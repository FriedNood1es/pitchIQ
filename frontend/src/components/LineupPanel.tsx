import { Injury, Lineup } from "../types";

interface Props {
  teamAName: string;
  teamBName: string;
  teamALineup?: Lineup;
  teamBLineup?: Lineup;
  teamAInjuries: Injury[];
  teamBInjuries: Injury[];
}

function PositionChip({ position }: { position: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
    >
      {position}
    </span>
  );
}

export function LineupSide({
  teamName,
  lineup,
  injuries,
  emptyLabel,
}: {
  teamName: string;
  lineup?: Lineup;
  injuries: Injury[];
  emptyLabel: string;
}) {
  const groups = ["GK", "DEF", "MID", "FWD"] as const;
  const playersByGroup = (group: string) =>
    (lineup?.startingXI ?? []).filter((p) => p.position === group);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--text)]">{teamName}</p>
        {lineup && (
          <p className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
            {lineup.formation}
            {lineup.confidence != null && (
              <> · {Math.round(lineup.confidence * 100)}% XI confidence</>
            )}
            {lineup.confirmed && (
              <span className="font-bold uppercase" style={{ color: "var(--good)" }}>
                {" "}· Confirmed
              </span>
            )}
          </p>
        )}
      </div>

      {lineup ? (
        <div className="mt-3 space-y-2.5">
          {groups.map((group) => {
            const players = playersByGroup(group);
            if (players.length === 0) return null;
            return (
              <div key={group}>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  <span>{group}</span>
                  <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                </div>
                <ul className="space-y-1">
                  {players.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">
                        {p.jerseyNumber ?? ""}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-2)]">
                        {p.captain && (
                          <span
                            aria-label="Captain"
                            title="Captain"
                            className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full align-text-bottom text-[10px] font-bold"
                            style={{ background: "var(--surface-3)", color: "var(--text)" }}
                          >
                            C
                          </span>
                        )}
                        {p.name}
                      </span>
                      {p.aiScore != null && (
                        <span
                          className="shrink-0 text-[10px] font-bold tabular-nums text-[var(--brand)]"
                          aria-label={`AI score ${p.aiScore} out of 100`}
                        >
                          {p.aiScore}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {lineup.substitutes.length > 0 && (
            <div className="pt-1">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Bench
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lineup.substitutes.map((p, i) => (
                  <span
                    key={i}
                    className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-xs text-[var(--text-2)]"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">{emptyLabel}</p>
      )}

      {injuries.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--loss)" }}>
            Unavailable
          </div>
          <ul className="space-y-1">
            {injuries.map((inj, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--loss)" }} />
                <span className="min-w-0 flex-1 truncate">
                  {inj.playerName}
                  {inj.position !== "Unknown" && (
                    <span className="text-[var(--muted)]"> — {inj.position}</span>
                  )}
                </span>
                {inj.expectedReturn !== "Unknown" && (
                  <span className="shrink-0 text-[var(--muted)]">{inj.expectedReturn}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Latest confirmed/predicted XIs for both teams plus each side's unavailable
 * players. The backend derives these from the teams' most recent finished
 * fixture, so they trail the actual kickoff lineups by a matchday.
 */
export function LineupPanel({
  teamAName,
  teamBName,
  teamALineup,
  teamBLineup,
  teamAInjuries,
  teamBInjuries,
}: Props) {
  const hasAny =
    teamALineup != null || teamBLineup != null || teamAInjuries.length > 0 || teamBInjuries.length > 0;

  if (!hasAny) {
    return (
      <details className="tl-card px-5 py-4" open>
        <summary className="tl-card-title cursor-pointer">Team News &amp; Lineups</summary>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No lineup or injury data on record for either team's most recent fixture.
        </p>
      </details>
    );
  }

  return (
    <details className="tl-card px-5 py-4">
      <summary className="tl-card-title cursor-pointer">Team News &amp; Lineups</summary>
      <p className="mt-1 text-xs text-[var(--muted)]">
        AI scores (0–100) rate how sure the model is about each starter —
        higher means surer. © marks the captain.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <LineupSide
          teamName={teamAName}
          lineup={teamALineup}
          injuries={teamAInjuries}
          emptyLabel="No lineup data for the last fixture."
        />
        <LineupSide
          teamName={teamBName}
          lineup={teamBLineup}
          injuries={teamBInjuries}
          emptyLabel="No lineup data for the last fixture."
        />
      </div>
    </details>
  );
}
