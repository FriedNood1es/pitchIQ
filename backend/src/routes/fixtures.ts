import { Router } from "express";
import { listFixtures, FixturesStatus } from "../agents/fixturesAgent";
import { getCompetition } from "../data/competitions";

const router = Router();

const VALID_STATUS: FixturesStatus[] = ["all", "finished", "scheduled", "live"];

/**
 * Recent results / upcoming fixtures for one league — or every supported
 * league when `competition` is omitted. `status` is all | finished | scheduled.
 * Fixtures come from the live season (the completed seasons used for compare
 * carry no fixtures); fetching by explicit status keeps live matches out.
 */
router.get("/fixtures", async (req, res) => {
  const competition = (req.query.competition as string) ?? undefined;
  const status = ((req.query.status as string) ?? "all") as FixturesStatus;

  if (competition && !getCompetition(competition)) {
    res.status(400).json({ error: "A valid competition is required" });
    return;
  }
  if (!VALID_STATUS.includes(status)) {
    res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(", ")}` });
    return;
  }

  try {
    res.json(await listFixtures(competition, status));
  } catch (err) {
    res.status(502).json({ error: `Failed to load fixtures: ${(err as Error).message}` });
  }
});

export default router;
