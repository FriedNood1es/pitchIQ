import { TeamStats } from "../types";
import { FormPills } from "./FormPills";
import { TeamCrest } from "./TeamCrest";

interface Props {
  competitionName: string;
  teamA: TeamStats;
  teamB: TeamStats;
}

function points(t: TeamStats) {
  return t.wins * 3 + t.draws;
}

function TeamBlock({
  team,
  seriesColor,
  align,
}: {
  team: TeamStats;
  seriesColor: string;
  align: "start" | "end";
}) {
  const alignClass = align === "end" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-1 flex-col gap-2 min-w-0 ${alignClass}`}>
      <div className={`flex items-center gap-2.5 ${align === "end" ? "flex-row-reverse" : ""}`}>
        <TeamCrest name={team.name} crestColor={team.crestColor} size={32} />
        <span className="text-lg font-bold truncate" title={team.name}>
          {team.name}
        </span>
      </div>
      <div
        className={`flex items-center gap-2 text-xs text-[var(--text-2)] ${
          align === "end" ? "flex-row-reverse" : ""
        }`}
      >
        <span
          className="inline-flex items-center gap-1.5 font-semibold"
          style={{ color: "var(--text)" }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: seriesColor }} />
          #{team.standingPosition}
        </span>
        <span>·</span>
        <span>{points(team)} pts</span>
      </div>
      <FormPills form={team.form} align={align} />
    </div>
  );
}

export function MatchHero({ competitionName, teamA, teamB }: Props) {
  return (
    <div className="tl-card p-5">
      <div className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
        {competitionName}
      </div>
      <div className="flex items-start gap-3">
        <TeamBlock
          team={teamA}
          seriesColor="var(--team-a)"
          align="start"
        />
        <div className="px-2 pt-1 text-sm font-bold text-[var(--muted)]">VS</div>
        <TeamBlock
          team={teamB}
          seriesColor="var(--team-b)"
          align="end"
        />
      </div>
    </div>
  );
}
