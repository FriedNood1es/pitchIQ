import { RetrievalResult, ValidatedData, ValidationIssue } from "../types";

/**
 * Checks the retrieved data for missing/stale fields. In the mock pipeline
 * this never needs to trigger a re-fetch, but the issue list is threaded
 * through to the final report so a real Data Retrieval Agent can be
 * plugged in later without changing this contract.
 */
export function runDataValidationAgent(data: RetrievalResult): ValidatedData {
  const issues: ValidationIssue[] = [];

  for (const key of ["teamA", "teamB"] as const) {
    const { stats } = data[key];
    if (stats.played <= 0) {
      issues.push({ field: `${key}.stats.played`, message: "Team has played 0 matches" });
    }
    if (stats.form.length === 0) {
      issues.push({ field: `${key}.stats.form`, message: "No recent form data available" });
    }
  }

  if (data.headToHead.length === 0) {
    issues.push({ field: "headToHead", message: "No head-to-head history found" });
  }

  return { ...data, issues };
}
