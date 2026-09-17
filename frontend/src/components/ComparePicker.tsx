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
  /** "form" is the full picker card; "bar" the slim re-compare strip. */
  layout: "form" | "bar";
}

/**
 * The single compare picker — one component for the initial form and the
 * re-compare bar so the two never drift (they once disagreed on "VS").
 */
export function ComparePicker({
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
  layout,
}: Props) {
  const disabled = teams.length === 0;
  const compareDisabled = isLoading || disabled || teamA === teamB;

  if (layout === "bar") {
    return (
      <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
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
            options={buildTeamOptions(teams, competition)}
            value={teamA}
            disabled={disabled}
            onChange={onChangeTeamA}
          />
          <span className="text-xs font-bold text-[var(--muted)]">vs</span>
          <IconSelect
            label="Away team"
            size="sm"
            className="min-w-40 flex-1"
            options={buildTeamOptions(teams, competition)}
            value={teamB}
            disabled={disabled}
            onChange={onChangeTeamB}
          />
          <button
            className="rounded-[10px] px-4 py-1.5 text-sm font-bold transition disabled:opacity-40"
            style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
            onClick={onCompare}
            disabled={compareDisabled}
          >
            {isLoading ? "Comparing…" : "Compare"}
          </button>
        </div>
        {teamA === teamB && (
          <p className="mx-auto max-w-4xl pb-1 text-xs" style={{ color: "var(--loss)" }}>
            Pick two different teams
          </p>
        )}
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
          label="Home team"
          className="w-full sm:flex-1"
          options={buildTeamOptions(teams)}
          value={teamA}
          disabled={disabled}
          onChange={onChangeTeamA}
        />
        <span className="text-center text-sm font-bold text-[var(--muted)]">vs</span>
        <IconSelect
          label="Away team"
          className="w-full sm:flex-1"
          options={buildTeamOptions(teams)}
          value={teamB}
          disabled={disabled}
          onChange={onChangeTeamB}
        />
        <button
          className="rounded-[10px] px-5 py-2.5 text-sm font-bold transition disabled:opacity-40 sm:w-auto"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          onClick={onCompare}
          disabled={compareDisabled}
        >
          {isLoading ? "Comparing…" : "Compare"}
        </button>
      </div>
      {teamA === teamB && (
        <span className="text-sm" style={{ color: "var(--loss)" }}>
          Pick two different teams
        </span>
      )}
    </div>
  );
}
