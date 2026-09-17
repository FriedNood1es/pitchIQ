import { Router } from "express";
import { COMPETITIONS, getCompetition } from "../data/competitions";
import { listStandings } from "../data/standings";
import { listTeams } from "../data/teamDirectory";
import { createLLM } from "../llm/llmClient";
import { runCompareOrchestrator } from "../orchestrator/compareOrchestrator";
import { CompareRequest } from "../types";

const router = Router();
const llm = createLLM();

/** Competitions available for comparison. */
router.get("/competitions", (_req, res) => {
  res.json(COMPETITIONS.map(({ id, name, country }) => ({ id, name, country })));
});

/** Teams in a competition (defaults to the Premier League). */
router.get("/teams", async (req, res) => {
  const competition = (req.query.competition as string) ?? COMPETITIONS[0].id;
  if (!getCompetition(competition)) {
    res.status(400).json({ error: `Unknown competition: ${competition}` });
    return;
  }
  try {
    res.json(await listTeams(competition));
  } catch (err) {
    res.status(502).json({ error: `Failed to load teams: ${(err as Error).message}` });
  }
});

/** Full standings table for a competition, ordered by position. */
router.get("/standings", async (req, res) => {
  const competition = (req.query.competition as string) ?? COMPETITIONS[0].id;
  if (!getCompetition(competition)) {
    res.status(400).json({ error: `Unknown competition: ${competition}` });
    return;
  }
  try {
    res.json(await listStandings(competition));
  } catch (err) {
    res.status(502).json({ error: `Failed to load standings: ${(err as Error).message}` });
  }
});

router.post("/compare", async (req, res) => {
  const { competition, teamA, teamB, message } = req.body ?? {};

  if (typeof competition !== "string" || !getCompetition(competition)) {
    res.status(400).json({ error: "A valid competition is required" });
    return;
  }

  if (typeof teamA !== "string" || typeof teamB !== "string") {
    res.status(400).json({ error: "teamA and teamB are required" });
    return;
  }

  if (teamA === teamB) {
    res.status(400).json({ error: "teamA and teamB must be different teams" });
    return;
  }

  const request: CompareRequest = { competition, teamA, teamB, message };
  try {
    const report = await runCompareOrchestrator(request, llm);
    res.json(report);
  } catch (err) {
    res.status(502).json({ error: `Failed to build comparison: ${(err as Error).message}` });
  }
});

export default router;
