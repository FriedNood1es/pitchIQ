import { runDataRetrievalAgent } from "../agents/dataRetrievalAgent";
import { runDataValidationAgent } from "../agents/dataValidationAgent";
import { runInsightAgent } from "../agents/insightAgent";
import { runNewsAgent } from "../agents/newsAgent";
import { getPredictedLineups, getUpcomingOdds } from "../agents/previewAgent";
import { runVisualizationAgent } from "../agents/visualizationAgent";
import { LLMClient } from "../llm/llmClient";
import { CompareReport, CompareRequest, Intent } from "../types";

export async function runCompareOrchestrator(
  request: CompareRequest,
  llm: LLMClient
): Promise<CompareReport> {
  const intent: Intent = {
    type: "team_comparison",
    competition: request.competition,
    teamA: request.teamA,
    teamB: request.teamB,
  };
  const retrieved = await runDataRetrievalAgent(intent);
  const validated = runDataValidationAgent(retrieved);
  const insight = await runInsightAgent(validated, llm, intent.competition);
  // Predicted XIs + bookmaker odds ride alongside news — off the insight
  // critical path.
  const [news, predicted, upcomingOdds] = await Promise.all([
    runNewsAgent(intent),
    getPredictedLineups(request.competition, request.teamA, request.teamB),
    getUpcomingOdds(request.competition, request.teamA, request.teamB),
  ]);
  const visualization = runVisualizationAgent(validated);

  return {
    intent,
    teams: {
      teamA: {
        stats: validated.teamA.stats,
        injuries: validated.teamA.injuries,
        lineup: validated.teamA.lineup,
        ...(predicted.teamA ? { predictedLineup: predicted.teamA } : {}),
      },
      teamB: {
        stats: validated.teamB.stats,
        injuries: validated.teamB.injuries,
        lineup: validated.teamB.lineup,
        ...(predicted.teamB ? { predictedLineup: predicted.teamB } : {}),
      },
    },
    headToHead: validated.headToHead,
    headToHeadAggregates: validated.headToHeadAggregates,
    validationIssues: validated.issues,
    insight: insight.summary,
    insightGeneratedBy: insight.generatedBy,
    prediction: insight.prediction,
    ...(upcomingOdds ? { upcomingOdds } : {}),
    news,
    visualization,
    generatedAt: new Date().toISOString(),
  };
}
