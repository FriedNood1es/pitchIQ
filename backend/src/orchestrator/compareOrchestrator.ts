import { runDataRetrievalAgent } from "../agents/dataRetrievalAgent";
import { runDataValidationAgent } from "../agents/dataValidationAgent";
import { runInsightAgent } from "../agents/insightAgent";
import { runNewsAgent } from "../agents/newsAgent";
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
  const news = await runNewsAgent(intent);
  const visualization = runVisualizationAgent(validated);

  return {
    intent,
    teams: {
      teamA: {
        stats: validated.teamA.stats,
        injuries: validated.teamA.injuries,
        lineup: validated.teamA.lineup,
      },
      teamB: {
        stats: validated.teamB.stats,
        injuries: validated.teamB.injuries,
        lineup: validated.teamB.lineup,
      },
    },
    headToHead: validated.headToHead,
    headToHeadAggregates: validated.headToHeadAggregates,
    validationIssues: validated.issues,
    insight: insight.summary,
    insightGeneratedBy: insight.generatedBy,
    prediction: insight.prediction,
    news,
    visualization,
    generatedAt: new Date().toISOString(),
  };
}
