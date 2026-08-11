import { Router } from "express";
import { getTeamStats } from "../agents/teamAgent";
import { getCompetition } from "../data/competitions";

const router = Router();

/**
 * Season stats for one team, matched by display name against the pinned
 * season's standings. Used by the team dashboard (search result -> team page).
 */
router.get("/team-stats", async (req, res) => {
  const competition = (req.query.competition as string) ?? "";
  const name = ((req.query.name as string) ?? "").trim();
  if (!competition || !getCompetition(competition)) {
    res.status(400).json({ error: "A valid competition is required" });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  try {
    res.json(await getTeamStats(competition, name));
  } catch (err) {
    res.status(404).json({ error: `Failed to load team stats: ${(err as Error).message}` });
  }
});

export default router;
