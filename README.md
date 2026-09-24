# PitchIQ

**Data-backed football match predictions.**

PitchIQ turns match data into prediction-ready insight. Pick any fixture on
the landing screen — or search for a club — and compare form, xG, head-to-head,
injuries and predicted lineups across 11 competitions (Big-5 leagues, European
cups, Eredivisie, Liga Portugal, Championship), with a structured win/draw/loss
forecast and narrative insight written by an LLM (or a deterministic
statistical model when no API key is set).

## Features

- **Fixtures landing** — every match across all competitions, filtered by
  all / live / finished / scheduled, with live scores and kickoff countdowns.
- **Match comparison** — a full report per pairing: form, xG ratings,
  head-to-head, injuries, lineups, and a stacked-bar prediction with an
  "AI Prediction" / "Statistical Model" badge. Finished matches open a
  result view (final score) instead of a forecast.
- **Head-to-head + rating profile** side by side on desktop; per-team news
  with content snippets and story artwork in the expanded list.
- **Team dashboard** — search any club for its predicted next-match XI, season
  stats and fixtures.
- **Badges via ESPN proxy** with colour-monogram fallback; dark/light themes;
  repeat visits reuse a 24h insight cache instead of re-billing the LLM.
- **Responsive single-page dashboard** (hash routes, no page reloads).

## Running it

Requires Node 20+. Data comes from BSD, so the backend needs `backend/.env`
with a `BSD_KEY` (see `backend/.env.example` — `.env` is gitignored). For AI
insight, set `LLM_API_KEY` **and** `LLM_MODEL` (e.g.
`openai/gpt-oss-20b` — the provider default is retired); without a key the
deterministic template runs.

```sh
npm install
npm run dev   # starts both: Express API on :4000 + Vite dashboard on :5173
```

The frontend proxies `/api` to the backend in dev; in production it uses
`VITE_API_URL`. Verification is a typecheck/build (there are no tests or
linter):

```sh
npm run build -w backend   # tsc -p tsconfig.json
npm run build -w frontend  # tsc -b && vite build
```

## Deploy

Split by runtime needs: the backend is long-lived Express with load-bearing
process state (BSD/insight/crest caches, boot search warmup), so it runs on
Render, not serverless — see `render.yaml` (build `npm install && npm run
build -w backend`, start `node backend/dist/index.js`, `/health` check).
The frontend is a static Vite bundle on Vercel (build
`npm run build -w frontend`, output `frontend/dist`, env `VITE_API_URL` →
the Render URL). Secrets (`BSD_KEY`, `LLM_API_KEY`, explicit `LLM_MODEL`)
live in the hosting dashboards only — never committed. Render's free tier
sleeps on idle; the first hit after sleep is slow (cold data fetch), which is
expected — the landing shows a "Waking up the server…" note when the first
load exceeds ~4s. To reduce sleeps for free, add an UptimeRobot monitor
pinging `https://<service>.onrender.com/health` every 5–10 min (one
always-warm service just fits the 750h/mo free quota); the durable fix is
Render Starter, which also keeps the 24h insight cache warm.

## Data & design notes

- **BSD is the sole data provider.** Current-season xG and fixtures; pinned to
  a completed season for standings. H2H and injuries are best-effort and never
  fabricated. No rate limit.
- **Badges resolve server-side** from a committed ESPN snapshot (all 11
  competitions), matched BSD→ESPN by name; unmatched clubs render as colour
  monograms — by design, not a bug.
- **News** comes from each club's BSD social feed (press headlines + the
  club's own posts), attributed and linked; story artwork is third-party and
  degrades to text when unavailable.

## Legal

Personal, non-commercial project — built for fun, offered "as is" (see
`LICENSE`), without warranties or liability of any kind.

- **Not betting advice.** Everything here is informational/entertainment
  content: probabilities, verdicts and prose are fallible model output, not
  tips. Never wager on the basis of this app.
- **No affiliation.** Not associated with any club, league, competition,
  BSD, ESPN, or LLM provider. Club names and badges are their owners'
  trademarks, used solely to identify the teams.
- **Third-party content.** Match data via the BSD API (subject to their
  terms), badge artwork via ESPN, news headlines/snippets attributed to
  their outlets and linked to the originals.
- **AI content may be wrong.** LLM-generated insight can misread data or
  contradict itself; the deterministic fallback is a simple statistical
  model, not a guarantee. Verify anything that matters.
- **Privacy.** No accounts, no analytics, no tracking. The only stored data
  is cache entries in your own browser's `localStorage`; API calls go to
  this project's backend, and images load from third-party CDNs as normal
  web traffic.

## More docs

- `AGENTS.md` — architecture, agent pipeline, data quirks and conventions.
- `roadmap.md` — the living changelog / roadmap.
