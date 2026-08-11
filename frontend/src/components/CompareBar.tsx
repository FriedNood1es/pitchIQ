import { Competition, TeamId, TeamSummary } from "../types";
import { IconSelect } from "./IconSelect";
import { buildCompetitionOptions, buildTeamOptions } from "./selectOptions";

interface Props {
  competitions: Competition[];
  competition: string;
  teams: TeamSummary[];
  teamA: TeamId;
  teamB: TeamId;
  onChangeCompetition: (competition: string) => void;
  onChangeTeamA: (team: TeamId) => void;
  onChangeTeamB: (team: TeamId) => void;
  onCompare: () => void;
  isLoading: boolean;
}

/**
 * Slim bar shown once a comparison exists — re-compare without navigating
 * back to the picker form. Rendered above the main content in App, not
 * inside the sticky header.
 */
export function CompareBar({
  competitions,
  competition,
  teams,
  teamA,
  teamB,
  onChangeCompetition,
  onChangeTeamA,
  onChangeTeamB,
  onCompare,
  isLoading,
}: Props) {
  const disabled = teams.length === 0;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 pb-3 pt-1">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
        <IconSelect
          label="Competition"
          size="sm"
          className="w-40"
          options={buildCompetitionOptions(competitions)}
          value={competition}
          disabled={competitions.length === 0}
          onChange={onChangeCompetition}
        />
        <IconSelect
          label="Home team"
          size="sm"
          className="min-w-40 flex-1"
          options={buildTeamOptions(teams)}
          value={teamA}
          disabled={disabled}
          onChange={onChangeTeamA}
        />
        <span className="text-xs font-bold text-[var(--muted)]">vs</span>
        <IconSelect
          label="Away team"
          size="sm"
          className="min-w-40 flex-1"
          options={buildTeamOptions(teams)}
          value={teamB}
          disabled={disabled}
          onChange={onChangeTeamB}
        />
        <button
          className="rounded-[10px] px-4 py-1.5 text-sm font-bold transition disabled:opacity-40"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          onClick={onCompare}
          disabled={isLoading || disabled || teamA === teamB}
        >
          {isLoading ? "Comparing…" : "Compare"}
        </button>
      </div>
    </div>
  );
}
