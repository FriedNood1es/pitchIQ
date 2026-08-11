# PitchIQ ⚽

**Data-backed football match predictions.**

PitchIQ turns match data into prediction-ready insight. Pick any fixture on
the landing screen — or search for a club — and compare form, xG, head-to-head,
injuries and predicted lineups across 11 competitions (Big-5 leagues, European
cups, Eredivisie, Liga Portugal, Championship), with a match insight written by
an LLM (or a deterministic template when no API key is set).

## Features

- **Fixtures landing** — every match across all competitions, filtered by
  all / live / finished / scheduled, with live scores and kickoff countdowns.
- **Match comparison** — pick two clubs to get a full report: form, xG
  profiles, head-to-head, injuries, predicted lineups, and an AI match insight.
- **Team dashboard** — search any club for its predicted next-match XI, season
  stats and fixtures.
- **Dark/light themes** and responsive single-page dashboard.

## Running it

Requires Node. Data comes from BSD, so the backend needs `backend/.env` with a
`BSD_KEY` (see `backend/.env.example` — `.env` is gitignored).

```sh
npm install
npm run dev:backend   # Express API on :4000
npm run dev:frontend  # Vite dashboard on :5173
```

The frontend proxies `/api` to the backend. Verification is a typecheck/build
(there are no tests or linter):

```sh
npm run build -w backend   # tsc -p tsconfig.json
npm run build -w frontend  # tsc -b && vite build
```

## Data & design notes

- **BSD is the sole data provider.** Current-season xG and fixtures; pinned to
  a completed season for standings. H2H and injuries are best-effort and never
  fabricated. No rate limit.
- **No crest images.** BSD exposes no badge artwork, so clubs render as colour
  monograms — by design, not a bug.
- **Match insight** is optional-LLM: set `LLM_API_KEY` (+ `LLM_PROVIDER`) in
  `backend/.env` for AI-generated insight, otherwise the deterministic
  template runs.

## More docs

- `AGENTS.md` — architecture, agent pipeline, data quirks and conventions.
- `NEXT_STEPS.md` — the living changelog / roadmap.
