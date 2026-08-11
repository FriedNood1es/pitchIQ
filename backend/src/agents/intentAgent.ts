import { CompareRequest, Intent } from "../types";

export function runIntentAgent(request: CompareRequest): Intent {
  return {
    type: "team_comparison",
    competition: request.competition,
    teamA: request.teamA,
    teamB: request.teamB,
  };
}
