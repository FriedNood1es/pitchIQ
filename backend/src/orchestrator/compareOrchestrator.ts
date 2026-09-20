import { runDataRetrievalAgent } from "../agents/dataRetrievalAgent";
import { runDataValidationAgent } from "../agents/dataValidationAgent";
import { runInsightAgent } from "../agents/insightAgent";
import { runIntentAgent } from "../agents/intentAgent";
import { runNewsAgent } from "../agents/newsAgent";
import { runReportAgent } from "../agents/reportAgent";
import { runVisualizationAgent } from "../agents/visualizationAgent";
import { LLMClient } from "../llm/llmClient";
import { CompareReport, CompareRequest } from "../types";

export async function runCompareOrchestrator(
  request: CompareRequest,
  llm: LLMClient
): Promise<CompareReport> {
  const intent = runIntentAgent(request);
  const retrieved = await runDataRetrievalAgent(intent);
  const validated = runDataValidationAgent(retrieved);
  const insight = await runInsightAgent(validated, llm, intent.competition);
  const news = await runNewsAgent(intent);
  const visualization = runVisualizationAgent(validated);

  return runReportAgent(intent, validated, insight, news, visualization);
}
