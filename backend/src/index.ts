import dns from "dns";
import cors from "cors";
import express from "express";

// Router DNS (dev.opt) blocks site.api.espn.com; Google DNS resolves it.
// ESPN image CDN (a.espncdn.com) is not blocked — badges load once URLs resolve.
dns.setServers(["8.8.8.8"]);
import { warmSearchIndex } from "./agents/previewAgent";
import compareRouter from "./routes/compare";
import fixturesRouter from "./routes/fixtures";
import previewRouter from "./routes/preview";
import searchRouter from "./routes/search";
import teamRouter from "./routes/team";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());
app.use("/api", compareRouter);
app.use("/api", fixturesRouter);
app.use("/api", previewRouter);
app.use("/api", searchRouter);
app.use("/api", teamRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`PitchIQ backend listening on http://localhost:${port}`);
  // Pre-build the search index so the first query is instant. Non-blocking:
  // the server starts immediately, warming happens in the background while
  // the user loads the landing view.
  void warmSearchIndex();
});
