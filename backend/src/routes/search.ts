import { Router } from "express";
import { searchTeams } from "../agents/searchAgent";

const router = Router();

/**
 * Global team search across all supported competitions. Results carry the
 * preview slug (matches the fixtures/preview endpoints) plus competition
 * context so the frontend can route to the right league.
 */
router.get("/search", async (req, res) => {
  const q = ((req.query.q as string) ?? "").trim();
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  try {
    res.json(await searchTeams(q));
  } catch (err) {
    res.status(502).json({ error: `Search failed: ${(err as Error).message}` });
  }
});

export default router;
