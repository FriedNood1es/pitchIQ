import {
  CompareReport,
  InsightResult,
  Intent,
  NewsResult,
  ValidatedData,
  VisualizationResult,
} from "../types";

export function runReportAgent(
  intent: Intent,
  validatedData: ValidatedData,
  insight: InsightResult,
  news: NewsResult,
  visualization: VisualizationResult
): CompareReport {
  return {
    intent,
    teams: {
      teamA: {
        stats: validatedData.teamA.stats,
        injuries: validatedData.teamA.injuries,
        lineup: validatedData.teamA.lineup,
      },
      teamB: {
        stats: validatedData.teamB.stats,
        injuries: validatedData.teamB.injuries,
        lineup: validatedData.teamB.lineup,
      },
    },
    headToHead: validatedData.headToHead,
    validationIssues: validatedData.issues,
    insight: insight.summary,
    insightGeneratedBy: insight.generatedBy,
    prediction: insight.prediction,
    news,
    visualization,
    generatedAt: new Date().toISOString(),
  };
}
