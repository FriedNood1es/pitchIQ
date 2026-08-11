import { Router } from "express";
import { listPreviewTeams, runPreviewAgent } from "../agents/previewAgent";
import { getCompetition } from "../data/competitions";
import { TeamId } from "../types";

const router = Router();

/**
 * Teams with an upcoming fixture in a competition's live season. Unlike the
 * compare picker (standings-based), this list is derived from the fixture
 * schedule so promoted clubs are included.
 */
router.get("/preview-teams", async (req, res) => {
  const competition = (req.query.competition as string) ?? "";
  if (!competition || !getCompetition(competition)) {
    res.status(400).json({ error: "A valid competition is required" });
    return;
  }
  try {
    res.json(await listPreviewTeams(competition));
  } catch (err) {
    res.status(502).json({ error: `Failed to load preview teams: ${(err as Error).message}` });
  }
});

/** Predicted lineups for a team's next upcoming fixture. */
router.get("/preview", async (req, res) => {
  const competition = (req.query.competition as string) ?? "";
  const team = (req.query.team as TeamId) ?? "";
  if (!competition || !getCompetition(competition)) {
    res.status(400).json({ error: "A valid competition is required" });
    return;
  }
  if (!team) {
    res.status(400).json({ error: "team is required" });
    return;
  }
  try {
    res.json(await runPreviewAgent(competition, team));
  } catch (err) {
    res.status(502).json({ error: `Failed to load preview: ${(err as Error).message}` });
  }
});

export default router;
