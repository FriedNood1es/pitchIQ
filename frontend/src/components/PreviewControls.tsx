import { Competition, TeamId, TeamSummary } from "../types";
import { IconSelect } from "./IconSelect";
import { buildCompetitionOptions, buildTeamOptions } from "./selectOptions";

interface Props {
  competitions: Competition[];
  competition: string;
  teams: TeamSummary[];
  team: TeamId;
  onChangeCompetition: (competition: string) => void;
  onChangeTeam: (team: TeamId) => void;
  onPreview: () => void;
  isLoading: boolean;
  variant: "bar" | "form";
}

/**
 * Single-team picker for the "Preview" tab: choose a club and view the
 * predicted lineups for its next fixture. Same option builders as the compare
 * form so the visuals can't drift.
 */
export function PreviewControls({
  competitions,
  competition,
  teams,
  team,
  onChangeCompetition,
  onChangeTeam,
  onPreview,
  isLoading,
  variant,
}: Props) {
  const disabled = teams.length === 0;

  const button = (
    <button
      className={
        variant === "bar"
          ? "rounded-[10px] px-4 py-1.5 text-sm font-bold transition disabled:opacity-40"
          : "rounded-[10px] px-5 py-2.5 text-sm font-bold transition disabled:opacity-40 sm:w-auto"
      }
      style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
      onClick={onPreview}
      disabled={isLoading || disabled || !team}
    >
      {isLoading ? "Loading…" : "Preview"}
    </button>
  );

  if (variant === "bar") {
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
            label="Team"
            size="sm"
            className="min-w-40 flex-1"
            options={buildTeamOptions(teams)}
            value={team}
            disabled={disabled}
            onChange={onChangeTeam}
          />
          {button}
        </div>
      </div>
    );
  }

  return (
    <div className="tl-card flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:w-28">
          Competition
        </span>
        <IconSelect
          label="Competition"
          className="w-full sm:w-64"
          options={buildCompetitionOptions(competitions)}
          value={competition}
          disabled={competitions.length === 0}
          onChange={onChangeCompetition}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <IconSelect
          label="Team"
          className="w-full sm:flex-1"
          options={buildTeamOptions(teams)}
          value={team}
          disabled={disabled}
          onChange={onChangeTeam}
        />
        {button}
      </div>
    </div>
  );
}
