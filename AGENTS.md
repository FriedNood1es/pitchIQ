# AGENTS.md

PitchIQ (repo dir `scoutai`) — data-backed football prediction app. Agent
pipeline on the backend, single-page dashboard on the frontend. Its primary
workflow is comparing two clubs — form, xG, head-to-head, injuries, predicted
lineups — to guide a match prediction.

## Commands

- Dev servers: `npm run dev` starts both (`dev:backend` on :4000 + `dev:frontend` on :5173, via `concurrently`).
  Or individually: `npm run dev -w backend`, `npm run dev -w frontend`.
- **There are no tests, no linter, no CI.** The only verification is a typecheck/build:
  `npm run build -w backend` (`tsc -p tsconfig.json`) and `npm run build -w frontend` (`tsc -b && vite build`).
  Run both after changes.
- For live-data end-to-end checks: `backend/scripts/verify.ps1` starts the built
  backend hidden, probes preview-teams/preview/compare with timings, then kills the
  server (no orphaned processes). Requires `npm run build -w backend` first.
  Also probes search (cold+warm), team-stats, and fixtures; supports `-SkipCompare`.
- Backend needs `backend/.env` with `BSD_KEY`;
  `.env` is gitignored, `.env.example` documents every variable.

## Architecture

- npm-workspaces monorepo. `backend/` is Express + `ts-node-dev` (CommonJS), `frontend/`
  is Vite + React 18 + Tailwind + TanStack Query + Chart.js (ESM).
- Backend is a deterministic agent pipeline — each "agent" is a plain function in
  `backend/src/agents/`. Flow: `routes/compare.ts` → `orchestrator/compareOrchestrator.ts`
  → intent → dataRetrieval → dataValidation → insight → news → visualization → report.
- **BSD is the sole data provider** (there is no second provider anymore — the
  API-Football fallback and crest system were removed). BSD has no rate limit
  and current-season + xG data. `BSD_SEASON` is pinned to a completed season
  because the live season has no table yet.
  `USE_MOCK_DATA=true` bypasses BSD. Mocks only cover **Arsenal and Chelsea**
  (`mocks/teams.ts`, `mocks/news.ts`, `mocks/headToHead.ts`) — mock mode rejects other teams.
- Team identity is a name-derived **slug** (`slugify` in `data/teamDirectory.ts`,
  folds diacritics: "Atlético" → `atletico-madrid`). Slugs are resolved dynamically
  against BSD's standings table — there is no hardcoded team-id catalog.
- Frontend is a single-view dashboard (no tabs): a **Fixtures** landing view
  (all/live/finished/scheduled across the 11 competitions, `routes/fixtures.ts`)
  where clicking any match row opens the **Compare** report for the two clubs
  (`FixturesView.tsx`, `MatchRow`, `#/fixtures` and `#/compare` hash routes).
  The old Compare/Preview tab switcher and the Preview UI were removed.
  **Scheduled rows tick down to kickoff** (`hooks/useCountdown.ts`: seconds
  within the hour, else once a minute) and **live matches** — fetched as a
  third BSD status alongside `finished`/`notstarted`, literal `LIVE_STATUS =
  "live"` in `fixturesAgent.ts` — show a LIVE badge, elapsed-minute clock and
  score. The `live` literal is not yet observed in the wild (no matches in
  play during pre-season); pin it the first time a real matchday confirms it.
- **Preview endpoints** (`routes/preview.ts`, `agents/previewAgent.ts`)
  predict a team's next-match XI. Reachable from the **team dashboard**
  (see below), not from a tab. They use the **live** season (`/leagues/{id}/` →
  `current_season.id` — the pinned completed season has no fixtures) and derive
  their roster from the season's `notstarted` fixtures, so promoted clubs are
  included. The team list caches ~1h and is pre-built at boot
  (`warmSearchIndex`). Their slugs come from live fixtures (`liverpool-fc`) and
  so differ from compare's standings slugs (`liverpool`).
- **Team dashboard** (`#/team/<competition>/<slug>`): a header `TeamSearchBox`
  hits `GET /api/search?q=` (`agents/searchAgent.ts`), which builds a global
  index from each league's `listPreviewTeams` (identity-only — no crest
  resolution needed since BSD has none). The index is warmed at boot, so the
  first query is ~15ms (was ~2.5s cold). A hit opens `TeamView` (Preview +
  Stats + Matches). Stats come
  from `GET /api/team-stats?competition=&name=` (`agents/teamAgent.ts`),
  reusing `dataRetrievalAgent`'s exported `bsdRowToStats` against the pinned
  completed season; names match exact → slugified → substring because live
  fixture names and standings names differ in places. European-cup hits for a
  club absent from that cup's completed season 404 on stats (degrade to an
  error card) — search ranks domestic entries first, so the top hit resolves.
- **Crests via ESPN proxy** (§8ad). BSD exposes no badge artwork, so badges
  resolve server-side through `clients/espnClient.ts` (`GET /api/crests?competition=`).
  Primary source: `data/espn-crests.json` (generated snapshot, committed —
  all 11 competitions, 264 teams, every URL HEAD-validated).
  The live ESPN API is an optional refresh — on blocked networks the JSON
  provides badges instantly; on unblocked networks it populates the 24h
  in-memory cache. Generation: `node scripts/fetch-espn-crests.mjs` from any
  machine with normal DNS, or `scripts/fetch-espn-crests.ps1` from behind
  dev.opt's block (resolves ESPN's IP over DNS-over-HTTPS and pins it with
  curl `--resolve`). Browsers can't call ESPN directly (no CORS), so
  every badge request routes through the backend. Frontend `crests.ts` does
  BSD→ESPN name matching (exact → normalized → unique one-directional token
  containment; ambiguous = monogram, never a wrong badge) with a 7-day
  `localStorage` cache + in-flight dedupe. `TeamCrest.tsx` layers the badge
  image over the mounted monogram (zero layout shift on load/failure).
  Coverage: ~85-100% for Big-5 leagues, lower for cross-border cups —
  monograms are the deliberate fallback.
- BSD client quirks (`clients/bsdClient.ts`): every request has an 8s
  `AbortSignal.timeout` (stalled third-party calls fail fast) and a 10min
  in-process cache.

## Provider data gaps (do not "fix" by fabricating)

- **Crest coverage is incomplete for cross-border cups.** ESPN resolution is
  ~85-100% for Big-5 domestic leagues, lower for UCL/Europa/Conference where
  cross-border clubs may not match. Monograms are the deliberate fallback.
- **H2H and injuries are real but best-effort.** BSD H2H comes from the mutual
  event between the two clubs (`v2/events/{id}/h2h/`, last 5, cross-season);
  injuries come from `unavailable_players` in the most recent finished event's
  v2 lineups payload (the `Injury.position` field is reused to carry BSD's
  reason, e.g. "Knee Injury"). Both degrade to `[]` on any failure or when
  there is no mutual/recent event — never an error, and never fabricated.
- **No possession anywhere** — `possessionAvg` is an estimate derived from points/game.
- **No team-filtered news endpoint** — news comes from BSD's team `social` feed
  (`bsd.team(id)`). `type: "news"` items carry content in `title`, `type: "tweet"`
  items in `text` (see `newsAgent.ts` `toNewsItem`). The feed needs the noise filter
  in `isEditorial` (sportsbook handles, `odds` in title, bare 5+ digit listing IDs).

## LLM status

- Match insight is generated by `insightAgent.ts`. With `LLM_API_KEY` set in
  `backend/.env`, `llm/remoteClient.ts` calls an OpenAI-compatible endpoint
  (`LLM_PROVIDER`: groq | gemini | openrouter) on a data brief
  (`buildDataBrief` — position, xG-derived ratings, goals/game, form, injuries,
  H2H); without a key it falls back to the deterministic
  `buildTemplatedInsight`. `insightGeneratedBy` distinguishes "ai" from
  "template". No key is committed. The default `llama-3.3-70b-versatile` was
  retired; set `LLM_MODEL=openai/gpt-oss-20b` (or another live model) in
  `.env` for Groq.
- **Structured prediction** (§8ah). One LLM call returns prose + probabilities:
  the prompt demands JSON `{summary, homeWin, draw, awayWin, confidence,
  keyFactor}` (sums to 100; fenced/preambled output is salvaged by brace
  extraction, malformed → template fallback). Without a key,
  `buildDeterministicPrediction` derives the same shape from the `edge.ts`
  weights via sigmoid (`value` 0 → 38/24/38, 14 → ~63/16/21). `PredictionBar`
  renders the stacked bar between hero and insight; badge reads "AI Prediction"
  vs "Statistical Model" so predictions never masquerade.

## Conventions & gotchas

- `roadmap.md` is the living changelog/todo — read it before working, and update it
  when you ship a chunk of work. `workflow/ScoutAI_Agentic_Workflow.md` is stale
  (mentions Prisma/PostgreSQL/OpenAI/LangChain that aren't in the code) — don't trust it.
- Competitions live in `data/competitions.ts` and are pinned to completed seasons with
  verified xG. The catalog is extendable: drop in an entry with a live-verified
  `bsdLeague`/`bsdSeason` and it flows through the whole stack (no agent
  changes). Currently 11 competitions (Big-5 + UCL + Europa + Conference + Eredivisie
  + Liga Portugal + Championship). Refreshing a season: `GET /seasons/?league=<bsdLeague>`,
  match on the season *name* (BSD's numeric `year` is unreliable).
- Crests: `CREST_COLORS` in `teamDirectory.ts` covers ~70+ clubs across Big-5
  + Eredivisie + Liga Portugal. Light-clad or unmapped clubs fall back to slate —
  decorative, never an error.
- Frontend proxies `/api` → `http://localhost:4000` via `vite.config.ts`.
- Style: 2-space indent, semicolons, double quotes. The codebase favours dense
  explanatory doc comments on non-obvious decisions — match that rather than adding
  obvious comments.
