import { CountryFlag } from "./CountryFlag";
import { TeamCrest } from "./TeamCrest";
import { SelectOption } from "./IconSelect";
import { Competition, TeamSummary } from "../types";

/** Shared option builders so the expanded form and the sticky bar can't drift. */
export function buildCompetitionOptions(
  competitions: Competition[]
): SelectOption[] {
  return competitions.map((c) => ({
    id: c.id,
    label: c.name,
    icon: <CountryFlag country={c.country} />,
  }));
}

export function buildTeamOptions(teams: TeamSummary[], competition?: string): SelectOption[] {
  return teams.map((t) => ({
    id: t.id,
    label: t.name,
    icon: <TeamCrest name={t.name} crestColor={t.crestColor} competition={competition} />,
  }));
}
