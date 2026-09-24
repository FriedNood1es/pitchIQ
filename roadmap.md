# PitchIQ — Roadmap

_Last updated: 2026-09-24_

## 8ay. Cold-start notice + keep-warm pinger docs ✅ DONE (2026-09-24)
Free-tier Render sleeps read as broken (identical skeletons for 300ms vs
60s). Landing skeletons now flip to a "Waking up the server…" `role=status`
note after 4s of `isFetching && !fixtures` (fast loads never see it;
compare deep-links deliberately excluded per scope). README Deploy documents
the free UptimeRobot `/health` ping (5–10 min, fits the 750h/mo quota) with
Starter as the durable fix.

## 8ax. Clickable team names → team dashboard (BSD-backed) ✅ DONE (2026-09-24)
Every team name opens that club's dashboard (`#/team/<competition>/<slug>`,
existing BSD-driven `TeamView`: fixtures-resolved identity, `useTeamStats`
with honest 404 card, `usePreview` lineups). No new endpoints, no new data
plumbing — the dashboard already resolves what BSD gives and degrades plainly.
Entry points today: header search, sidebar favorites, compare-fallback,
direct URL. Dead surfaces: `MatchRow` TeamLine, `StandingsTable` rows,
`HeadToHeadPanel` rows (+ hero/legend/lineup/news headers, phase 2).
Primitives exist: `handleSelectTeam` (`App.tsx:432-444`, needs
`{competition, competitionName, country, id, name, crestColor}`) and
`resolveTeam` (`App.tsx:45-58`, standings→preview slug bridge, same gap
`handleNavigate` already crosses).
Phase 1 (core): MatchRow lines (preview slug is free on `FixtureTeam` —
`<span role="link">` + stopPropagation + keyboard, row stays a button so no
nested `<button>`; thread `onSelectTeam` beside `onNavigate` through
`FixturesView→DateSection` and `TeamView→MatchList`), StandingsTable rows
(real `<button>` in `<td>`, `resolveTeam` vs App's preview list, fallback to
dashboard + notice when unresolvable), H2H rows (names-only, same resolution;
thread preview list + `onSelectTeam` through the compare section). Phase 2
(optional): hero/legend/lineup/news headers; TeamView news section via the
existing per-team social feed. Verify: frontend build + click each Phase-1
surface → correct dashboard, unresolvable → notice, never a dead end.
Shipped Phase 1 (2026-09-24): new `TeamName.tsx` (`role=link` span +
`matchPreviewTeam`/`normalizeTeamName`, App's local normalizer removed);
MatchRow names build the dashboard result off the fixture (preview slug is
free); StandingsTable rows are buttons resolving via focused-mode
`usePreviewTeams`; H2H names resolve via compare-mode `usePreviewTeams`;
unresolvable → dashboard + `fallbackNotice` (new optional `handleSelectTeam`
param). Phase 2 deferred. Frontend build green.
Shipped Phase 2 (2026-09-24): hero names (`MatchHero` TeamBlocks), stats
legend, lineup side headers and news column headers all open dashboards via
the renamed `handleOpenCompareTeam` (same preview-slug resolution + notice
fallback); `TeamName` gained an overridable `title` for truncated names.
TeamView grew a Latest News section on new `GET /api/team-news`
(`newsAgent.getTeamNews` reusing the social feed + shared `teamAgent`
`resolveStandingsRow` tiers, always 200 with `[]` on miss) via `useTeamNews`
and the exported `NewsColumn`. Live probe: Arsenal 6 items, unknown club
`[]`. Both builds green.

## 8aw. Impeccable re-audit fixes II (17/20 → P1/P2) ✅ DONE (2026-09-20)
Harden: skip-to-content link (off-screen until focused, reduced-motion-safe)
targeting `<main id="main">`; collapsed intro keeps an `h1` so date `h2`s
never orphan; status filter is a real radiogroup (`role="radio"` +
`aria-checked`, arrow nav kept); prediction segments expose `title` so
sub-12% values survive hover. Optimize: one shared `useNow(1000, hasLive)`
per match list passed down to a now-pure `LiveCell` — lists without live rows
run zero intervals (the `ponytail:` comment is resolved, not just moved).
Dropdown `li`s deliberately left untabbable — making them tab stops would
break the combobox pattern the report itself endorses. Both builds green.

## 8av. Impeccable re-audit fixes (16/20 → P1/P2/P3) ✅ DONE (2026-09-20)
Optimize: crest loading lifted to a shared store (`useSyncExternalStore` +
one `warmCrests()` at boot — TeamCrest is a pure lookup, no more 2×
subscriptions and 11-list merges per row); chart.js code-split via
`React.lazy` (own 169KB chunk, main bundle 433→267KB, skeleton fallback).
Harden: IconSelect combobox semantics moved to the focused trigger
(`aria-activedescendant` off the `ul`); `summary:focus-visible` joins the ring
rule; functional text floored at 12px (lineup labels/chips/scores, LIVE
badge, prediction badges/legend — captain "C" keeps 10px, it has
aria-label+title). Adapt/distill: compare bar stacks full-width under `sm:`
(`vs` hidden on mobile); one `points()` in `edge.ts` replaces three copies.
Polish: `.tl-divide` CSS rule replaces the `divide-[var()]` hack; stepper
glyphs `aria-hidden`; inline SVG pitch favicon. Deliberately kept: per-row
live clocks (negligible at current scale, marked `ponytail:`). Both builds
green.

## 8au. Impeccable audit fixes (17/20 → P1/P2/P3) ✅ DONE (2026-09-20)
TeamSearchBox is keyboard-navigable (arrows/Home/End/Enter, input-owned
`aria-activedescendant`, plain `li role="option"` — the button-nested pattern
is gone) mirroring IconSelect; date-bucket headings are `h2` (no more
`h1`→`h3` skip) and Latest News summary title is `h2` so column `h3`s nest;
slide indicator transitions transform only (width snaps, no per-frame
layout); prediction-bar `%` labels hide below 12% width (parent `role="img"`
label + legend carry the values); stat-bar tracks are `aria-hidden` (values
already text). Deliberately not changed: IconSelect scroll stays instant
(smooth would add motion; instant is reduced-motion-safe by default), per-row
live timers and radar `getComputedStyle` left as negligible. Both builds green.

## 8at. Over-engineering cut (ponytail-audit) ✅ DONE (2026-09-20)
Deleted ~700 lines + 2 deps, one commit (easy rollback): mock mode gone
(`mocks/*`, `USE_MOCK_DATA` branches — news degrades to `[]`, never invented
clubs); `intentAgent`/`reportAgent` inlined into the orchestrator;
`CompareRequest.message` dropped; `liveSeason.ts` folded into
`bsd.liveSeason()`; `MockLLMClient` class → literal, stale groq default model
→ `openai/gpt-oss-20b`; shared `backend/src/utils.ts` (`errMsg`,
`positionGroup`); `cors`→manual headers, `dotenv`→`process.loadEnvFile()`;
`bsd.standings` requires explicit args (dead `BSD_LEAGUE`/`BSD_SEASON` env
dropped from config/`.env.example`/`render.yaml`); dead
`PreviewControls.tsx` deleted; `selectOptions.tsx` inlined into
`ComparePicker`; shared `frontend/src/dates.ts` (5 local formatters → 1);
tailwind scaffold keys; root `build` now builds both workspaces;
`tsconfig.tsbuildinfo` untracked; stale `workflow/` doc deleted. Both builds
green. Skipped (product, not bloat): IconSelect, chart.js/RadarChart,
react-query, useTheme, hash router, crests matcher/cache, HeroAnchors.

## 8as. README refresh + MIT LICENSE ✅ DONE (2026-09-20)
README rewritten to the current build (prediction bar, result view, H2H/radar
grid, news snippets + thumbnails, ESPN badges, mandatory `LLM_MODEL`, new
Deploy section) plus a Legal section: personal/non-commercial, not betting
advice, no affiliation, third-party attribution, AI-may-be-wrong, no
tracking. MIT `LICENSE` added (was missing entirely). Both builds green.

## 8ar. Deploy-ready: Render backend + Vercel frontend ✅ DONE (2026-09-20)
Split by runtime needs: the backend is long-lived Express with load-bearing
process state (10-min BSD, 24h insight/crest caches, boot search warmup), so
it goes to Render, not serverless. `render.yaml` blueprint (build `npm
install && npm run build -w backend`, start `node backend/dist/index.js`,
`/health` check, secrets `sync: false`). Frontend takes `VITE_API_URL`
(exported `apiBase` from `api/client.ts`, reused by `crests.ts`; empty =
same-origin dev) — Vercel project uses build `npm run build -w frontend`,
output `frontend/dist`. Root `build`/`build:all` scripts + `engines
node>=20` added; `vite/client` types enabled. Verified: both builds green +
`node backend/dist/index.js` serves `/health` from root. Rotate the Groq key
before pasting into dashboards; free Render sleeps on idle (Starter keeps
the insight cache warm).

## 8aq. News thumbnails in the open list ✅ DONE (2026-09-20)
BSD story artwork (`thumbnail`, previously dropped) now flows through
`NewsItem` to thumbnail-left rows in the expanded list (112×72, rounded,
lazy, error-hidden → text row). Tweets/imageless items keep the text layout;
closed preview stays text snippets. Live probe Betis–Osasuna: 6/6 items,
Betis tweets carry `pbs.twimg.com` thumbs, Osasuna none (fallback path
confirmed). Both builds green. Noted: BSD text shows mojibake on some emoji
(pre-existing, upstream).

## 8ap. News preview: per-team content snippets ✅ DONE (2026-09-20)
The closed Latest News section now previews each club's latest item: team
dot + headline + relative time, plus the post body clamped to two lines
(tweets show headline only — the post text already is the headline). Preview
rows hide once expanded (they duplicated the first items), and the user
toggle now owns the open state instead of snapping back on re-render.
`line-clamp-2` verified emitted in the bundle. Both builds green.

## 8ao. News preview shows the truly freshest story ✅ DONE (2026-09-20)
The closed Latest News preview took team A's latest before team B's, so a
fresher rival story lost to a stale one. It now picks the newest headlined
item across both feeds, attributed (`Team: headline · source · 2h ago`).
Both builds green.

## 8an. H2H + radar side-by-side on desktop ✅ DONE (2026-09-20)
H2H rows were two lines with dead space on the right. Rows are now one line
(matchup truncate + winner bold left, date right, tighter padding); H2H and
Rating Profile share an `sm:grid-cols-2` row (stacked on mobile, anchor ids
preserved). The radar's collapse disclosure became a static card — in a grid
it would unbalance the pair, and the grid already pays the space it saved.
Empty-H2H pairings stack as before (`contents` fallback). Both builds green.

## 8am. Projected scoreline removed (self-contradicting verdict) ✅ DONE (2026-09-20)
Betis–Osasuna showed "Real Betis to win" beside a projected 1–1: the verdict
(edge weights, +28.8) and the scoreline (goal averages 1.43 vs 1.21, both
rounding to 1) were independent formulas sharing a card. The projection is
gone from `MatchHero` (center now renders only for finished fixtures' FT
score); `DataEdge.score` and its computation removed. Sweep: hero verdict and
deterministic fallback share weights (consistent by construction); the AI bar
can still differ from the hero, which is legitimate signal (e.g. injuries),
not a second deterministic verdict. Both builds green.

## 8al. Finished rows open a result view, not a prediction ✅ DONE (2026-09-20)
Tapping a finished row showed a prediction (probabilities + "Projected"
scoreline) for a decided game — the FT score was dropped at navigation.
`pendingCompare` now carries the fixture's status/score/date into a session
`matchContext`; a finished context swaps the hero center to the actual FT
score ("Full-time") and hides `PredictionBar` + its anchor chip. Any re-pick,
competition switch, hash load or home/back clears the context, and finished
rows with null scores fall back to the prediction view. Frontend-only; both
builds green.

## 8ak. Leeds crest: poisoned 7-day browser cache ✅ DONE (2026-09-20)
Arsenal–Leeds scheduled PL row showed Arsenal's badge but a Leeds monogram.
Data was fine (backend serves Leeds United/357; BSD names it identically, so
the matcher exact-hits). Cause: `crests.ts` caches each league list 7 days
with no invalidation on snapshot regen — visits since §8ad held the old
10-team PL seed with no Leeds. Fix: cache key v2→v3 (one line), shedding
everyone's stale entries on next load. Discipline: bump the key version with
every `fetch-espn-crests` regen, or this ghost recurs.

## 8aj. Insight cache: reloads no longer burn LLM tokens ✅ DONE (2026-09-20)
Reloading `#/compare/...` re-ran the Groq call (`temperature 0.7`) — new text
every refresh, billed every refresh. `runInsightAgent` now keeps a 24h
in-process cache keyed `competition|sorted teams|sorted injury names`
(order-normalized, A-vs-B hits B-vs-A with home/away probs swapped).
Template fallback stays uncached (free; a transient LLM failure must not pin
it for a day). `useCompareTeams` gained a 10-min `staleTime` to skip
in-session refetch. Verified: both builds green + node harness (same pair 1
call, flipped order 1 call with swapped probs, new competition/injuries miss).

## OPEN — unfinished business
- [ ] **Crest eyeball on an unblocked network.** Pipeline is verified to the
  data source; badges vs monograms (and wrong-badge scan) still need eyes —
  tether 5 min to warm caches, or check after deploy.
- [ ] **Rotate the Groq key.** It lived in chat history, shell history, and
  `.env` logs — rotate in the Groq console, update `backend/.env`.
- [x] **Commit the pile.** Committed: insight cache, finished-result view,
  projected-score removal, H2H/radar grid, news snippets + thumbnails, crest
  v3 key (see §§8aj–8aq).
- [ ] **Dark logo variant.** ESPN serves `500-dark/` artwork per team; prefer
  it under the dark theme (needs theme-aware picking in `TeamCrest`).
- [ ] **Decide on strays.** `.impeccable/` (critique reports) is untracked —
  track or delete. (`frontend/src/icons/` is already gone.)
- [ ] **Prediction-data phase.** Still the app's real goal — H2H aggregates,
  predicted-XI-in-compare, raw xG surfacing, numeric probabilities, BSD
  `predictions`/`odds` probes (see §7-era notes deeper in this file).

## 8ab. Groq live for match insight ✅ DONE (2026-09-17)
`LLM_API_KEY` set (gitignored `.env`, to be rotated — lived in chat);
default model was retired (`llama-3.3-70b-versatile` → model_not_found), so
`LLM_MODEL=openai/gpt-oss-20b` (from the key's live model list) plus a token
budget bump (350 → 1500 — reasoning models spend tokens thinking before the
`content` field fills). Verified live: `insightGeneratedBy=ai` with
model-written prose; failures still fall back to the template.

## 8ai. Fresh injuries, crest fallback, merged prediction ✅ DONE (2026-09-20)
Three credibility/density fixes. (1) Injuries from the LIVE season, not the
pinned completed one — frozen events listed transferred players (Jesus still
"injured" for Arsenal post-Barça). `fetchTeamNews` resolves
`getLiveSeasonId`, falls back to pinned when none exists. Verified live:
Arsenal [Copley, Saliba], Chelsea [João Pedro], Jesus gone. (2) `TeamCrest`
falls back to the merged all-competition list on a miss — promoted clubs live
in a different ESPN section than BSD (Leeds: BSD Championship vs ESPN PL).
Verified: championship-only misses, fallback hits. (3) Insight prose merged
into `PredictionBar` (one card: bar → factor → narrative → timestamp);
`InsightPanel.tsx` deleted; prompt no longer asks prose to pick a winner.

## 8ah. Structured match prediction ✅ DONE (2026-09-20)
One LLM call now returns prose + probabilities: prompt demands JSON
`{summary, homeWin, draw, awayWin, confidence, keyFactor}`, brace-extracted
and validated (sums to 100, else template fallback). Brief enriched with
goals/game, conceded/game, form points. Without a key,
`buildDeterministicPrediction` derives the same shape from the `edge.ts`
weights via sigmoid. `PredictionBar` renders the stacked bar between hero and
insight with an "AI Prediction" / "Statistical Model" badge. Verified live:
Groq returned 70/15/15 high-confidence Arsenal–Chelsea with xG-grounded prose.
Tab chrome cleaned: empty favicon (`data:,`), ⚽ dropped from title, stray
ball SVG deleted.

## 8ag. Compare survives reload ✅ DONE (2026-09-20)
Reloading `#/compare/<comp>/<a>/<b>` reset to the first two standings teams.
Race between two effects: Effect 1 set competition + cleared `hashDraft` in
one batch, so Effect 2 still saw `competition === ""` and bailed on
`hashDraft.competition !== competition` — the team IDs died with the draft
and the fill effect defaulted to teams[0]/teams[1]. Fix: Effect 1 no longer
clears `hashDraft` for compare mode; Effect 2 consumes it once teams load
(it already cleared the draft there). Team/fixtures paths unchanged.

## 8af. Crest matcher: aliases, ø fix, reverse tiebreak ✅ DONE (2026-09-20)
BSD names carry affixes ESPN drops ("FC Barcelona", "Levante UD") and a few
clubs differ entirely ("Real Racing Club" vs "Racing Santander", "Inter" vs
"Internazionale", München/Munich, Köln/Cologne). `crests.ts` now: explicit
ø/Ø/ł/Ł pre-normalization (no NFD decomposition exists — "Bodø/Glimt" lost
its `o`), a 14-entry BSD→ESPN ALIAS map for unbridgeable names, and a reverse-
containment tiebreak preferring candidates whose extra BSD tokens are all
generic affixes ("Deportivo Alavés" → "Alavés", not "Deportivo"). Verified
with a node harness over all 133 BSD domestic names vs the merged 216-team
ESPN list: 117 match, every hit the correct club, all 16 misses genuinely
absent from ESPN's 2026/27-season snapshot (relegated sides, Girona/Mallorca/
Oviedo). Euro cups stay sparse — different tournament editions, not a bug.

## 8ae. Full crest coverage (all 11 competitions, 264 badges) ✅ DONE (2026-09-20)
Static snapshot graduated from the 10-team PL seed to every team ESPN lists:
20/20/20/18/18 across Big-5, 36/36/36 across the three Euro cups, 18/18
Eredivisie/Liga Portugal, 24 Championship — 264/264 logo URLs HEAD-validated
against the CDN. Unblocked by resolving ESPN's IP over DNS-over-HTTPS
(`https://1.1.1.1/dns-query`, an IP literal so no local DNS is needed) and
pinning it with curl `--resolve` (correct SNI + cert, unlike IP fetching).
New `backend/scripts/fetch-espn-crests.ps1` does this end-to-end on DNS-blocked
networks; the `.mjs` stays the clean-plain-fetch version for normal machines.
`GET /api/crests` verified per competition on a fresh built server (a stale
dev server initially served the old seed — killed, re-probed, all counts
match). Frontend untouched: `crests.ts` matching already handles all leagues.

## 8ad. ESPN crests via backend proxy, parser verified ✅ DONE (2026-09-17)
Six-probe saga: browser CORS, local DNS refusal, Akamai edge 403s, empty
CloudFront 202s, TSDB's 10/20 + zero cups — all ruled out or rejected, which
is why this is a same-origin `GET /api/crests` proxy (`clients/espnClient.ts`,
24h success-only cache) with doc-confirmed slugs (Conference =
`uefa.europa.conf`). Frontend matches BSD→ESPN names (exact → normalized →
unique one-way containment) and layers badges over monograms. Parser verified
field-by-field against a real pasted `teams` entry (Bournemouth: displayName,
default-rel href, string id, abbreviation all hit; matcher resolves). Badges
appear on deploy/tether; monograms until then. Future: prefer the `dark` logo
variant under the dark theme.

## 8aa. ESPN crests (monogram fallback preserved) ✅ DONE (2026-09-17)
BSD has no artwork, so badges resolve frontend-direct from ESPN's keyless
API — zero backend involvement. `crests.ts`: per-league team lists (7-day
localStorage + shared in-flight dedupe), BSD→ESPN matching (exact →
normalized → unique one-directional containment; ambiguous = monogram), logo
pick prefers the `default` rel variant. `TeamCrest` renders the badge over
the mounted monogram (zero shift, silent fallback) once `competition` is
passed — wired through rows, hero, standings tables, dashboard header,
sidebar favorites, search, and both picker layouts. Conference League slug
(`uefa.conference`) is unverified and degrades cleanly. Frontend build green;
badges need a browser eyeball (this machine's DNS blocks ESPN).

## 8z. Audit fixes with pushback ✅ DONE (2026-09-17)
Compare audit scored 17/20. Fixed the legit half, contested the rest:
- **Live region:** sr-only `aria-live="polite"` status node in compare mode
  (Comparing… / ready / failure text) + `aria-busy` on `main` while fetching.
- **Focus return:** `IconSelect` trigger ref, focus restored on Escape and on
  commit (keyboard users keep their place).
- **Headings:** `LineupSide` h3 → styled `p` (summaries aren't real headings,
  so the h3s dangled). Trailing bars 0.55 → 0.75. Dead `<title>` out of the
  aria-hidden X svg.
- **Contested, unchanged:** muted contrast (measured 5.37–7.36, all pass —
  the P1 was a false positive); radar memo (reverted in §8y with cause);
  H2H truncation (two-line wrap is the settled call); Chart.js (audit says
  leave); captain "C" badge (doesn't exist — © + legend stands).
- Both builds green.

## 8y. Polish-pass review (subagent) ✅ DONE (2026-09-17)
Reviewed the subagent's direct-to-tree polish instead of trusting it: kept
SVG glyph swaps, contrast bumps, radar sr-table, active anchor state.
Reverted all-sizes sticky anchors to `lg:` (mobile header wraps taller than
the 80px offset) and reverted the RadarChart token memo (per-instance theme
state never re-renders on toggle — stale chart colors; per-render reads are
unmeasurably cheap here). Committed as `4bf86c7` (not pushed).

## 8x. Re-critique round: news, verdict, disclosures, identity ✅ DONE (2026-09-17)
- **layout:** News auto-expands on <48h-fresh items, stays shut for stale;
  summary surfaces the top headline + relative time beside the counts.
- **clarify:** hero verdict call ("X to win" + strength pill) with a labeled
  projected scoreline from scoring/conceding averages (estimate, per the
  possession precedent — never model output); raw edge demoted to detail.
- **distill:** LineupPanel + RadarChart are native disclosures (empty lineup
  stays open); per-side header is one legend row, aiScore the one number.
- **polish:** `CREST_COLORS` extended past the PL (dark/saturated only —
  Villarreal yellow cut for contrast; verified live: Barça/Atlético/Madrid
  resolve); radar gained an sr-only data table; anchors track `aria-current`;
  bar picker gained the same-team warning; "Form" anchor → "Ratings".
  (Caught an unquoted key by building: dev is transpile-only.) Both green.

## 8w. Compare re-critique follow-through ✅ DONE (2026-09-17)
- **layout:** hero + verdict banner merged into one verdict header (edge,
  reasons, gap line, sticky desktop anchors); `VerdictBanner.tsx` deleted.
  (Also fixed a stale-dev incident: restarted Vite, which was serving the
  pre-merge App transform.)
- **clarify:** per-row football deltas ("Arsenal ahead by 8", conceded
  inverted); edge/confidence/aiScore/© all announce meaning on focus.
- **distill:** lineup headers are one legend row
  (`4-3-3 · 68% XI confidence · Confirmed`); aiScore stays the one
  per-player number.
- **polish:** "Form" anchor renamed "Ratings" to match the card title.
  Frontend build green.

## 8v. Compare page critique follow-through (26/40 → fixes) ✅ DONE (2026-09-17)
- **layout:** `edge.ts` deterministic data edge (ratings + 8×ppg gap + form +
  2×H2H, Toss-up/Lean/Edge bands); `VerdictBanner` (edge + strength + reasons
  + anchor chips) sits hero → verdict → insight prose; sections carry ids;
  News collapsed with per-team counts.
- **bolder:** edge value in leader team-color replaces symmetric VS; trailing
  name steps back (crest/numbers full); points-gap line with honest fallbacks.
- **clarify:** magnitude-relative stat bars on a track; visible ratings +
  possession-estimate footnotes; "Auto · data brief" badge; lineup
  confidence/aiScore/captain legend.
- **distill:** `ComparePicker` (`form`/`bar`) deletes both pickers, "vs"
  unified; picks survive competition switches via stashed-name resolution.
- **polish:** radar `h-96` → `h-72 sm:h-80`; H2H two-line rows; 𝕏 titled;
  `generatedAt` reuses relative `formatWhen`. Frontend build green.

## 8u. Honest no-stats state + quiet 404s ✅ DONE (2026-09-17)
Coventry/West-Ham-style 404s rendered a red error card with a Retry button
that could never succeed. Split by cause: `getJson` now carries the HTTP
status on thrown errors, `useTeamStats` never retries 404s (502s keep 2
retries), and `TeamView` renders a neutral muted info card for 404s ("no
completed-season table entry — likely new to the competition; preview and
fixtures use live data", no Retry) while real failures keep the red retry
card. Frontend build green, dev transform confirmed fresh.

## 8t. Re-critique actions (rank, affordance, voice) ✅ DONE (2026-09-17)
- **onboard:** hero auto-collapses once fixtures exist (first visits with data
  land on matches; empty/error states still teach). Manual Hide persists;
  Intro reopens for the session.
- **distill:** overview bands rank live-now → scheduled-today → rest by
  country. No counts — ranked without them per the §8o decision standoff.
- **clarify:** rows carry a persistent low-emphasis "Compare ›" (aria-hidden,
  inside the row button so no extra tab stop; pending spinner kept).
- **bolder (light):** ⚽ emoji out, text wordmark in (`Pitch` + brand `IQ`);
  one form-streak badge per band ("X unbeaten in N", 3+ from the band's own
  finished fixtures, hidden on small phones). No rebrand, tone untouched.
- Frontend build green, dev transform confirmed fresh.

## 8s. Critique follow-through (24/40 → fixes) ✅ DONE (2026-09-17)
Homepage critique scored 24/40; worked the plan stepwise, favorites kept
separate from leagues throughout.
- **layout:** hero collapses to a one-line strip after first dismissal
  (`pitchiq:hero-collapsed`), so returning visits open onto matches.
- **distill:** one league model — `usePinnedLeagues` + pinned-first ordering
  moved into `FixturesView`; sidebar and mobile chips render from it (a pin
  reorders both).
- **clarify:** finished rows lost the disabled-looking dim (FT + scores carry
  it); stepper ‹ › gained sighted tooltips; copy left clinical as-is.
- **audit:** arrow-key roving focus on rows/pills/chips (one 15-line helper,
  disabled rows skipped); stepped day (by stable date key) + scroll offset
  persist session-scoped with restore-once guards. Focus rings verified
  global; identity never color-only (initials + names as text).
- **polish:** stepper scroll margin `scroll-mt-4` → `scroll-mt-24` so date
  labels clear the sticky header. Frontend build green.

## 8r. Sliding status-pill indicator ✅ DONE (2026-09-17)
The green highlight now glides between All/Live/Finished/Scheduled instead of
snapping. No new deps: an absolutely-positioned span in the (now `relative`)
pills track, placed from the active button's `offsetLeft/offsetWidth` in a
`useLayoutEffect` (pre-paint, so no glide on first load), `transform/width`
transition for the glide, `ResizeObserver` to stay correct on resizes and font
swaps. Buttons went transparent (`z-10`, text-only active/inactive colours).
Reduced-motion snaps via the existing `index.css` block. Chips keep the
instant swap (a slider would fight the scroller). Frontend build green, dev
transform confirmed fresh.

## 8q. Standings never fetched on first render ✅ FIXED (2026-09-17)
Symptom: Standings section skeletoned forever in the focused view. Cause: the
fetch lived in `toggleCollapse` (closed→open transition), but focused bands
start open — the transition never fires. Fix: a priming `useEffect` on
`[competition, collapsed, tables, tableErrors]` that fetches whenever the
focused band is open and uncached (covers first render and re-expands);
`toggleCollapse` is a pure collapse toggle again. Guards make re-runs no-ops.
Frontend build green, dev transform confirmed fresh.

## 8p. Focused band: stacked standings + batched paging ✅ DONE (2026-09-17)
- **Tabs out:** the Matches/Table mini-tabs are gone. A focused league band
  stacks date sections → Show more/fewer → full standings table. Overview
  bands stay matches-only and never fetch.
- **Fetch on expand:** opening a focused band primes its table (once per
  competition, cached; skeletons + per-key errors unchanged). `tableBands`
  state and `showTable` deleted.
- **Batched paging:** `visibleCount` per band (default 20) replaces the
  boolean expand — each click reveals the next 20, then flips to Show fewer
  (resets to 20). Applies to overview and focused views via the same path;
  the stepper still derives days from visible sections only.
- Verified: frontend build green + dev-server transform confirmed fresh
  (`showFewer` present, `showTable`/`tableBands` gone).

## 8o. Landing declutter: sports strip gone, focused tables, 20-cap paging ✅ DONE (2026-09-17)
- **Sports strip removed** (`App.tsx`): football-only per AGENTS.md, so the
  Football-active/disabled-others nav is deleted; sticky container is
  header-only again.
- **Table tabs only when focused** (`FixturesView.tsx`): mini-tabs render only
  in single-league view. Overview bands are matches-only, which also ends the
  11-band standings-fetch fan-out (tabs are the sole fetch trigger).
- **Counts gone everywhere:** band, sidebar-row and chip badges deleted;
  `counts` memo and sidebar `counts`/`total` props removed.
- **20/page paging:** `visibleGroups` slices each band to the first 20 matches
  in display order (sections never split empty) with per-band "Show more
  matches (N more)" ↔ "Show fewer" (`expandedLeagues`, reset on filter change).
  Tables always show full; the stepper derives days from visible sections so
  ‹ › never targets a hidden day. Both builds green.

## 8n. Skipped Flashscore items included ✅ DONE (2026-09-17)
Date stepper, MY TEAMS, standings tables, sports strip — all four land.
- **Standings (backend):** `GET /api/standings?competition=` (`data/standings.ts`
  + route in `routes/compare.ts`, `fetchStandings` client). Maps pinned-season
  rows through `bsdRowToStats` (returns `TeamStats[]`, no new types); lives in
  its own module because the agent already depends on `teamDirectory` (reverse
  import would cycle). Mock mode returns `[]` → "No standings" note, never
  invented rows. Verified live: 20 PL rows in 377ms.
- **Table tabs:** each expanded band has Matches/Table mini-tabs; tables fetch
  once per competition (cached in `tables`, per-key errors, skeleton rows while
  loading). Full table (Pos, Team, P/W/D/L, GD signed, Pts).
- **Date stepper:** ‹ day › pager in the pills card walks the loaded list's
  distinct days (display order) and smooth-scrolls to each date section
  (`scroll-mt`, `aria-live` label, auto scroll under reduced-motion). Resets on
  filter change; hidden when a single day is loaded.
- **MY TEAMS:** `useFavoriteTeams` (`localStorage`, keyed competition/id);
  star toggle in the `TeamView` header; sidebar section opens the dashboard via
  `onSelectTeam` (new `FixturesView` prop, `App` passes `handleSelectTeam`).
  Unstar from the dashboard; sidebar rows navigate.
- **Sports strip:** sticky sub-header nav — Football active, Basketball/Tennis/
  Cricket disabled with honest "isn't covered yet" tooltips (no fake entries).
- Both builds green (117 modules).

## 8m. Flashscore-style landing (sidebar + bands + two-line rows) ✅ DONE (2026-09-17)
Fixtures landing restructured after the Flashscore reference (full restyle +
real pinning + hero kept), frontend-only.
- **Sidebar** (`LeagueSidebar.tsx`, desktop `lg:` only): All-leagues entry,
  pin-to-top sections with counts, click filters via the existing competition
  state. Pins persist in `localStorage` (`usePinnedLeagues.ts`, JSON
  try/catch). Mobile keeps the chips scroller (`lg:hidden`).
- **League bands:** headers are full-bleed `surface-2` bands with a collapse
  chevron (`aria-expanded`, session-only `Set` — revisits never hide matches).
- **Two-line rows** (`MatchRow.tsx`): time column (FT/kickoff, LIVE+minute,
  countdown+kickoff), home-over-away lines with right-aligned per-line scores
  once played. `TeamView` inherits the look (shared component). Pending
  spinner/`aria-busy` kept.
- Filter card slimmed to pills-only (caption dropped, `role=group` kept).
  Both builds green (116 modules).
- **Non-goals:** date stepper, MY TEAMS/favorites, Standings links,
  multi-sport strip.

## 8l. Filter-card round-trip ✅ DONE (2026-09-17)
An `/impeccable` subagent pass un-clumped the Matches buttons (full-width
pills, wrapped chips, divider deleted) — read as worse on review (stretched
pills, chips wall, lost structure). Rolled the three overcorrections back to
the middle ground in `FixturesView.tsx`: pills keep the `gap-1 p-1` separation
but are `flex-none` (compact unit, left-aligned under caption); league chips
are a single scroll row again (sticky-"All" stays removed, so no overlap);
hairline divider restored. Kept: stacked captions, group aria-labels, count
badges, `rounded-xl`. Frontend build green.

## 8l. Fixtures filter toolbar de-clump ✅ DONE (2026-09-17)
Impeccable `layout` on `FixturesView.tsx` (detector clean before + after).
Status segmented control was `inline-flex p-0.5` with gapless `px-3 py-1` buttons
(cramped); league chips were a scroll-strip sharing one card + divider with the
same pill language, so ~16 buttons blurred together. Now: status group gets
`gap-1 p-1`, `rounded-xl`, `flex-1 sm:flex-none px-4 py-1.5` buttons on a
label-aligned row; leagues `flex-wrap` (no scroll-strip, no fade mask); hairline
divider deleted in favour of `space-y-5` proximity rhythm. Frontend-only, both
builds green.

## 8k. Audit fixes (14/20 Good) ✅ DONE (2026-09-17)
Impeccable audit `frontend` scored 14/20 (Good), detector clean, integrity Pass.
Fixed all 3 P1s + cheap P2s, frontend-only.
- **Touch targets:** one global rule (`index.css`: `button,
  input[type=search], [role=option]` get `min-height: 44px`) instead of N
  one-off edits — chips, pills, toggles, retry/dismiss all comply, visuals
  just gain padding.
- **Reduced motion:** existing `reduce` block now also kills Tailwind
  `animate-ping`/`animate-spin`; **light `--muted`** unified to `#5f6368`
  (was two disagreeing values, one failing AA).
- **Semantics:** search input is a real combobox (`role`, `aria-expanded`,
  `aria-controls`); `IconSelect` wires `aria-activedescendant` via `useId`;
  compare/team routes gained `h1`s (sr-only matchup title in `MatchHero`,
  `h2`→`h1` in `TeamView`).
- **Tokens:** new `--on-color` (white, all 3 themes) replaces `text-white`/
  `bg-white`/`#fff` escapes in LIVE badge, monograms, form pills; LIVE red is
  now `var(--loss)`.
- **Deferred:** shared live clock + virtualization (`ponytail:` note in
  `MatchRow`) — unmeasured, few live games. Both builds green.

## 8j. Homepage critique fixes (26/40 → follow-ups) ✅ DONE (2026-09-17)
Impeccable critique `fixturesview-tsx` scored 26/40 (Acceptable). Shipped the
cheap, high-value half; skipped per-row xG/form signals (needs backend + design).
- **Silent reroute → notice:** `App.tsx` keeps a `fallbackNotice` ("No comparison
  data for X yet — showing their dashboard instead", dismissible `role=status`)
  when a row falls through to a team dashboard. Cleared on navigate/home/search.
- **Row pending state:** `pendingEventId` (BSD `eventId: number`) flows
  App → FixturesView → MatchRow; tapped row shows spinner, `aria-busy`,
  `disabled` (no double-taps), "Loading comparison…" title.
- **League strip orientation:** sticky "All leagues" chip, match-count badges on
  every chip + league header (from loaded fixtures), tooltips; thumb-first rows
  (`min-h-48px`, `py-3`, 18px chevron, finished `opacity-80`).
- **Search/header 360px:** input `w-full max-w-14rem`, dropdown `left-0 right-0`
  on mobile, 1-char hint ("need at least 2 characters"), warmer no-result copy.
- **Onboard:** hero gained one-line monogram/countdown explainer. No backend,
  no CSS, no routing changes. Both builds green.

## 8i. Homepage: hero + league chips + row affordance ✅ DONE (2026-09-17)
First-run gate was high: guidance was one muted paragraph, leagues hid in a
dropdown, rows looked static. FixturesView now opens with a hero ("Pick a
match. Get a data-backed prediction." + 1-2-3 strip), the competition
dropdown is a scrollable one-tap chip row (flags, `aria-pressed`, active =
brand), MatchRow gained a chevron hover affordance + finished-row dimming,
and empty states are per-filter. Tokens/motion reuse `index.css`
(   `tl-card`, `tl-reveal`); no backend or routing changes. Both builds green.
   Follow-up: filter card rebuilt as one labeled panel (Matches: pills /
   League: chips in-card with `min-w-0 flex-1` scroller, unselected chips on
   `surface-2` so they read on the card); per-filter empty states kept.

## 8h. Critique fixes: verdict-first report ✅ DONE (2026-09-15)
Impeccable critique `frontend-src-app-tsx` scored 24/40 (Acceptable). Fixed top 3:
Insight promoted under MatchHero as verdict, News collapsed to native details,
single reveal moment (hero+insight only), `border-l-4/2` accents cut to 1px
(detector clean), Possession relabeled `(est.)` with estimate tooltip,
TeamView stats-404 explains pinned-vs-live fallback. Builds green.

Suggested follow-up work, roughly in order of value-for-effort.

---

## 8. Team search → team dashboard (Preview / Stats / Matches) ✅ DONE (2026-08-10)
A header **search box** now finds any team across all 11 competitions and opens
a **team dashboard**: predicted lineups, season stats, and that club's fixtures.
- **Backend:** `GET /api/search?q=` (`agents/searchAgent.ts`, `routes/search.ts`)
  — the index is the union of every competition's `listPreviewTeams` (cached
  ~1h each and pre-built at boot by `warmSearchIndex`, so the first query after
  startup is instant). Results rank exact → prefix → substring, and a
  team's **domestic league outranks its European-cup entries** (the pinned
  *completed* season always has domestic standings, so stats resolve for the
  top hit). The index is built **crest-free** (`listPreviewTeams` with
  `withCrests: false`) — resolving crests for 11 leagues at once tripped
  API-Football's 10/min limit and starved the whole app of crests for the
  10-min cache window; the search dropdown shows monograms and real crests
  come from the fixtures/team calls.
  `GET /api/team-stats?competition=&name=` (`agents/teamAgent.ts`,
  `routes/team.ts`) reuses the compare pipeline's `bsdRowToStats` (now exported
  from `dataRetrievalAgent.ts`); names resolve exact → slugified → substring
  (live fixtures and standings differ, e.g. "Feyenoord Rotterdam" vs
  "Feyenoord"). Reuses `/api/preview` (lineups) and `/api/fixtures` (matches).
- **Frontend:** `TeamSearchBox` in the header (debounced dropdown, crest +
  league flag). New `team` hash mode `#/team/<competition>/<slug>`; `TeamView`
  composes `PreviewPanel` (re-imported — was dead since §6), new
  `TeamStatsPanel` (position/points/record/GD, form pills, xG ratings) and a
  Matches section (recent + upcoming, date-labelled). `MatchRow` extracted from
  `FixturesView` into a shared `components/MatchRow.tsx`; clicking a match row
  from the team page opens the same Compare report as the fixtures landing.
  "← Fixtures" returns to the landing (kept on that league).
- **Known edge:** a European-cup hit for a club absent from the cup's completed
  season (e.g. "AFC Ajax [Conference League]") has **no stats in that
  competition** — team-stats 404s and the stats panel degrades to an error card
  while preview + matches still work; domestic-first ranking sends most clicks
  to the entry that has stats.
- `verify.ps1` gained search (cold+warm), team-stats and preview probes;
  full run green.

## 8b. Crest pipeline: rate-limited, non-blocking ✅ DONE (2026-08-11)
The all-leagues fixtures landing was still starving the app of badges: a cold
load fanned out ~11-22 API-Football crest calls at once against the free
plan's 10 req/min, 429ing almost everything and baking monograms into the
10-min cache. Crest resolution is now rate-limited and decoupled from the
response.
- **`data/crests.ts`:** a token-bucket limiter (~8/min, burst 3) gates every
  crest call. `crestUrlsFor(comp, names, { wait })` — `wait: false` callers
  take a token only if one is free right now, else skip; `wait: true` (default)
  queues; `wait: "background"` (the fill) **yields to synchronous callers**, so
  a fill never stalls a request the user is waiting on. Cached crest responses
  (the 6h client cache) skip the limiter entirely. Skipped leagues are topped
  up by the fill below.
- **`agents/fixturesAgent.ts`:** the all-leagues load returns fixtures fast
  with whatever crests cost nothing (6h client cache + `seenTeams` pool + free
  tokens), then a background `fillCrests` re-resolves each league through the
  limiter — **domestic leagues before European cups** so the `seenTeams` pool
  covers cup clubs for free — writing each league's result back as it finishes
  (single in-flight guard per cache key). Single-competition views and the
  team dashboard stay synchronous (1-2 calls each).
- **`frontend useFixtures.ts`:** while any fixture lacks a crest, refetch every
  15s so badges appear progressively; polling stops once the fill lands.
- Search warm-up landed here too: `warmSearchIndex()` (crest-free) fires after
  `app.listen` and the base team lists cache ~1h, so the first search is ~15ms
  (see §8).
- First full fill takes ~2-3 min against the free-plan limit (the API-Football
  client's 6h in-memory cache then makes revisits instant); a backend restart
  clears that cache and re-fills in the background — accepted, no disk cache.

## 8c. Kickoff countdowns + live matches ✅ DONE (2026-08-11)
- **Countdowns:** every scheduled fixture row now ticks down to kickoff —
  `1d 4h` / `3h 24m` / `12m 30s`, flipping to `KO` at kickoff — with the kickoff
  clock kept as a secondary line. Frontend-only (`hooks/useCountdown.ts`,
  `MatchRow.tsx`); ticks every second only for matches within the next hour,
  otherwise once a minute, so a full fixtures list doesn't run a timer per row.
  The team dashboard's Matches section reuses `MatchRow`, so it gets them free.
- **Live matches:** BSD marks in-progress fixtures with a per-fixture `status`
  string (confirmed so far: `finished`/`notstarted`/`postponed`). The fixtures
  feed now fetches a third status (`LIVE_STATUS = "live"`, `fixturesAgent.ts`)
  and maps in-progress matches as `status: "live"`, shown with a pulsing LIVE
  badge, an elapsed-minute clock (derived from kickoff) and the live score.
  New **Live** filter pill in `FixturesView`; `#/fixtures/.../live` hash works.
- **Caveat:** no matches were in progress during the work (European pre-season;
  Brazilian Serie A on break since 26 Jul), so the `live` literal is **not yet
  confirmed in the wild** — verified the fetch path returns 0 gracefully. Pin
  `LIVE_STATUS` once a real matchday confirms the spelling; live scores also
  refresh on the 10-min BSD cache (no live-aware polling yet).

## 8d. Head-to-head: newest matches + visible attribution ✅ DONE (2026-08-11)
- **`.slice(-5)` was keeping the OLDEST five meetings.** BSD returns
  `recent_matches` newest-first, so the panel showed 2021–2023 games instead of
  the recent ones (which could all read as "W" if the old run was team-A home
  wins). Now sorted date-desc and sliced to the first 5 — e.g. Arsenal vs Man Utd
  shows 2026-01-25 → 2024-05-12 (`dataRetrievalAgent.ts` `fetchH2h`).
- **Attribution is now explicit:** `HeadToHeadPanel.tsx` renders a color legend
  under the title (`W` = team-A win, `L` = team-B win, `D` = draw) so the
  W/D/L pill is self-explanatory instead of a bare colored letter.
- The W/D/L math itself was already correct (verified live: `W W L W L`); no
  logic change was needed there.

## 8e. Real LLM wiring for Match Insight (key optional) ✅ DONE (2026-08-11)
The `AI` badge is now honest, and dropping a key in later activates a real model
with no code change.
- **Config:** `LLM_PROVIDER` (`groq` default | `gemini` | `openrouter`),
  `LLM_API_KEY`, `LLM_MODEL` (`config.ts`; endpoint + default model maps).
  No key → deterministic template, exactly as before.
- **`llm/remoteClient.ts`:** OpenAI-compatible chat-completions client via
  global `fetch` (no new deps), 10s `AbortSignal.timeout` so a stalled/
  rate-limited provider never hangs a compare. `llmClient.ts` gained
  `createLLM()` and a `kind: "ai" | "template"` on the interface.
- **`insightAgent.ts` restructured:** `buildTemplatedInsight` (the fallback),
  `buildDataBrief` (JSON brief), `buildPrompt` (brief + "write 3-4 sentences,
  only use this data"). LLM failure degrades to the template. Also fixed the
  open H2H-copy bug — the "Over the last 0 meetings…" clause is suppressed
  when there are no meetings.
- **Honest badge:** `CompareReport.insightGeneratedBy: "ai" | "template"`;
  `InsightPanel` shows `AI` only when model-written, else `Auto` (tooltip
  explains). Resolves the "label is wrong" thread.
- Verified: no key → `generatedBy: "template"` (same prose); bogus key → 401 in
  ~0.4s and clean fallback. Get a free key at console.groq.com / aistudio.google.com
  / openrouter.ai and set `LLM_API_KEY` to go live.

## 8f. No dead clicks: match rows always navigate ✅ DONE (2026-08-11)
Clicking a fixtures row for a club missing from the pinned season used to do
**nothing** — the resolve effect exact-matched fixture names against the
completed-season standings and silently dropped unresolvable clicks.
- **Root cause:** fixtures come from the *live* season (promoted clubs, UCL
  qualifiers), standings from the pinned *completed* season. Measured: 8/30 PL,
  33/35 UCL rows were dead.
- **Frontend (`App.tsx`):** `resolveTeam()` tiers exact → normalized (diacritic-
  folding) → one-directional substring (mirrors `teamAgent.ts`; never the
  reverse, which could match "Wolverhampton" to "Wolverhampton Casuals"). A
  click now **always lands**: both clubs resolve → compare; otherwise → the
  unresolvable club's **team dashboard** (preview + fixtures work off live
  season, stats degrades to an error card) — Flashscore-style, never a dead end.
- **Backend (`dataRetrievalAgent.ts` + `routes/compare.ts`):** `/api/compare`
  no longer 400s unknown teams; a slug absent from the standings degrades to
  `emptyTeamData` (played 0, empty form), flagged by the validation agent as
  "Team has played 0 matches". Route wrapped in try/catch → 502 like `/teams`.
- **Report UI (`App.tsx`):** `report.validationIssues` now renders as a notice
  card under `MatchHero`, so a degraded pairing shows a clear "some data is
  incomplete" card instead of a raw error (also fixes the European-cup-no-stats
  case).
- Verified live: resolution across 6 leagues → 0 dead clicks; Coventry City
  compare returns played=0 + validation issues; `#/team/.../coventry-city`
  dashboard serves real preview data.

## 8g. API-Football removed — BSD-only ✅ DONE (2026-08-11)
Crests and the fallback data provider are gone. **BSD is now the sole data
provider**; every team renders as a colour monogram (BSD exposes no badge
artwork). This kills the crest inconsistency (no more half-crest/half-monogram
mixes), removes the free-plan token headaches (100 req/day, 10 req/min), and
makes league switching load straight from BSD's 10-min cache — no rate limiter,
no background fill, no 15s crest-poll loop.
- **Deleted:** `clients/apiFootballClient.ts`, `data/crests.ts`,
  `data/crestCache.ts` (and `backend/.cache/`). `afLeague` removed from the
  `Competition` type + all 11 entries in `competitions.ts`. `crestUrl` removed
  from backend + frontend types.
- **config.ts:** `DataProvider` type, `config.provider` and the `apiFootball`
  block removed; `API_FOOTBALL_KEY/LEAGUE/SEASON` dropped from `.env` /
  `.env.example` (backend now needs only `BSD_KEY`).
- **Agents:** `dataRetrievalAgent` lost its API-Football fallback branch
  (`retrieveFromApiFootball`/`buildApiFootballTeam`/`mapInjuries`/`mapHeadToHead`);
  `teamDirectory.listTeams` is BSD-only and no longer attaches crests;
  `fixturesAgent` lost `attachCrests`/`fillCrests` + the `crestUrl` field and
  the background fill on cache hit; `previewAgent` collapsed the
  crest-free/crest-augmented cache split into a single ~1h list
  (`listPreviewTeams` is identity-only) and lost the non-BSD "not available"
  guard; `newsAgent` lost the provider check.
- **Frontend:** `TeamCrest` is monogram-only (no `<img>`/failed-state);
  `crestUrl`/`crestUrls` plumbing stripped from `MatchRow`, `MatchHero`,
  `PreviewPanel`, `selectOptions`, `TeamSearchBox`, `TeamView`, `App.tsx`;
  `useFixtures` lost the "poll while crests missing" refetch loop.
- Both builds green.

---

## ⏳ OPEN — pick up here (2026-08-11)

Unfinished / to do:

- [x] **Picker bars glued to the sticky header.** The Compare/Preview picker
  bars lived inside the `sticky top-0` container, so they stuck to the header
  on scroll as one tall strip. Both bars now render above `<main>` (header
  stays sticky alone); tradeoff: re-compare/re-preview while scrolled means
  scrolling back up.
- [x] **Preview picker duplication.** The Preview tab's sticky picker bar
  (`PreviewControls` `bar` variant) was shown whenever a team was auto-defaulted,
  duplicating the form card's controls before any preview existed. Bar now keys
  off `canPreview` (mirrors `CompareBar`), so the initial view is just the card.
- [ ] **Browser-verify the single-view app.** §6 (below) is implemented and
  builds are green; fixtures endpoints are verified live (see
  `backend/scripts/verify.ps1`). Remaining: screenshot/DOM-check the Fixtures
  landing and the Compare report reached from a match row (dark & light).
- [ ] **Match-row → Compare name matching.** Rows resolve the two clubs into
  standings slugs by display name; if BSD names fixtures and standings
  differently (e.g. "Man. City" vs "Manchester City") the row won't navigate.
  Worth a fuzzy fallback or backend-side slug if it bites.
- [x] **Preview `preview-teams` first-hit latency.** Cold load is ~5s (paginates
  4×100 live fixtures + crests); warm is ~14ms via the in-process cache. §8's
  search re-exposes this: the first search after a backend start cold-builds
  the 11-competition index (~2.5-3.5s) and the same run trips the API-Football
  per-minute crest limit (degrades to monograms, self-heals via the 6h cache).
  **Fixed 2026-08-11:** `warmSearchIndex()` pre-builds the crest-free index at
  boot (`index.ts`), and the base team lists now cache ~1h — first search is
  ~15ms. Crest starvation is handled separately by §8b.
- [ ] **Preview vs compare slug identity.** Preview slugs (`liverpool-fc`) and
  compare slugs (`liverpool`) diverge because they derive from different
  sources (live fixtures vs standings). Both tabs are gone, but fixtures still
  carry preview-style slugs and compare needs standings slugs — worth aligning
  (`teamDirectory.ts` aliases) if the name-matching above ever bites.
- [ ] **Crest-colour map gaps** (`data/teamDirectory.ts` `CREST_COLORS`
  covers ~35 clubs across Big-5 + Eredivisie + Liga Portugal + Old Firm);
  uncovered clubs (Championship, cross-border cups, remaining Dutch/
  Portuguese sides) fall back to slate grey. Badges are back via the ESPN
  proxy (§8ad), so this is monogram-underlay polish only — decorative, never
  an error.
- [x] **Insight copy degrades badly with no H2H.** Fixed §8e (H2H clause
  suppressed when empty) and §8at (mock mode deleted — template/LLM only).
- [ ] **Future competition additions (Wave 2+).** §7 shipped Europa League,
  Conference League, Eredivisie, Liga Portugal and Championship. All remaining
  BSD leagues were probed and every candidate has a completed 25/26 (or 2025)
  season with full xG standings — see §7 for the verified list. Natural next
  picks, in rough priority: Brasileiro Serie A (9), MLS (18), Liga MX
  Apertura/Clausura (19/20), Argentina LPF (85), J1 League (49), K League 1
  (50), Saudi Pro League (17), Scottish Premiership (13), Belgian Pro League
  (14), Swiss Super League (15). Since §8g each needs only a `competitions.ts`
  entry (bsdLeague/bsdSeason) + a `CountryFlag.tsx` SVG for any new country —
  no `afLeague`, no crest spot-check.
- [ ] **Prediction-data phase (the app's real goal).** BSD already exposes most
  of what a prediction tool needs; the app just doesn't surface it all. In
  rough value order:
  - [x] **H2H aggregates** — `fetchH2h` now returns the cross-season counts
    framed from team A (rates derived from counts — BSD's own rate scale is
    unverified) as `headToHeadAggregates`, threaded to the report; the panel
    shows "N meetings · A x% · Draw y% · B z% · g goals/game". Verified live:
    Arsenal–Man Utd 74 meetings, 23/20/31, 2.5 goals/game.
  - **Next-match predicted XI in Compare** — reuse `/predicted-lineup`
    (already used by the team-dashboard preview) so compare shows each club's
    predicted starters with per-player `ai_score` (0-100), availability and
    formation confidence; compare currently shows the *last finished* lineup.
  - [x] **Raw xG numbers** — `bsdRowToStats` now also emits per-game
    `expectedGoalsFor/Against` (2dp, only when the season carries xG);
    compare shows xG scored/conceded rows (both-sides-or-neither) and the
    team dashboard prints xG beside GF–GA. Verified live: Arsenal 1.72/0.78,
    Chelsea 1.74/1.38.
  - **Numeric prediction panel** — a deterministic home/draw/away probability +
    over/under derived from form + xG + H2H rates. The app has no numeric
    prediction output today (insight is narrative only).
  - **Probe BSD's `predictions`/`odds` endpoints** — see the bonus-data note
    at the bottom; never explored, likely the highest-value prediction source.
- [x] Next: **#3 real LLM** — wired §8e (2026-08-11); just needs a key.
  No key = deterministic template; with `LLM_API_KEY` set, `insightAgent` sends
  a data brief to an OpenAI-compatible endpoint and the `AI` badge lights up.

Running locally: backend `npm run dev -w backend` (:4000), frontend
`npm run dev -w frontend` (:5173). Needs `backend/.env` with `BSD_KEY`.

---

## 4. Real lineups, injuries & head-to-head ✅ DONE (2026-08-10)
The comparison page now shows live team news from BSD instead of mocks.
- **BSD lineups** (`/v2/events/{id}/lineups/`): `lineup_status`
  `confirmed|predicted|unavailable`; per-side `formation`, `confidence`,
  `players`, `substitutes`; `unavailable_players` (name/status/reason/
  expected_return) per side.
- **Injuries** map from `unavailable_players` — the `Injury.position` field is
  reused to carry BSD's reason (e.g. "Knee Injury"). `status` collapses to
  `out`/`doubtful`.
- **H2H** (`/v2/events/{id}/h2h/`): the mutual event between the two clubs is
  found via the fixtures list, then its cross-season `recent_matches` are
  mapped (name→slug resolution through the id-keyed fixture list, last 5).
- Backend: `bsd.teamFixtures`/`v2Lineups`/`v2H2h` in `bsdClient.ts`;
  `dataRetrievalAgent` BSD path rewritten (`buildBsdTeam`, `fetchTeamNews`,
  `mapBsdPlayer`, `fetchH2h`); lineup passed through `reportAgent`.
  Best-effort — any call failure degrades to `{injuries: []}`.
- Frontend: `LineupPanel.tsx` (formation/confidence/confirmed badge, XI grouped
  GK/DEF/MID/FWD, bench chips, unavailable list) rendered in `App.tsx` between
  the key stats and H2H. Mock lineups added for arsenal/chelsea.
- **Robustness:** every BSD request now carries an 8s `AbortSignal.timeout` —
  a stalled third-party call fails fast instead of hanging the endpoint.

## 4b. Preview: AI-predicted lineups for the next fixture ✅ DONE (2026-08-10)
A new "Preview" tab shows a team's predicted XI for its next match.
- BSD `/predicted-lineup/{eventId}/` → `{event, lineups:{home,away}}` with
  `predicted_formation`, `confidence` (0-100), `starters` (position letter,
  `ai_score` 0-100, `availability`, `injury_type`, `predicted_slot`).
- Preview uses the **live season** (`/leagues/{id}/` → `current_season.id`) —
  the pinned completed season has no upcoming fixtures.
- Live-season standings are **empty**, so `/api/preview-teams` derives its
  roster from the season's `notstarted` fixtures (paginated) — this includes
  newly promoted clubs (e.g. Coventry City). Assembled list cached ~10min.
- Backend: `previewAgent.ts` (slug→id via the preview list, earliest upcoming
  fixture, predicted lineup, best-effort), `routes/preview.ts`
  (`GET /api/preview-teams?competition=`, `GET /api/preview?competition=&team=`).
- Frontend: mode-aware hash (`#/compare/<comp>/<a>/<b>` vs
  `#/preview/<comp>/<team>`), Compare/Preview tabs (Compare stays default),
  `PreviewControls` picker, `PreviewPanel` (match header + two predicted XIs
  reusing `LineupSide`; elapsed-seconds loading hint).
- Verified live: Arsenal next up Coventry City (event 209535, 4-3-3 vs
  4-2-3-1, conf 0.65/0.61, 11 starters each with ai_scores).
- `backend/scripts/verify.ps1`: one-shot verification — starts the backend
  hidden, probes preview-teams (cold+warm), preview, compare with timings,
  prints the progress log tail, then always kills the server (no window
  popups, no orphaned processes).

---

## 5. Fixtures landing view ✅ DONE (2026-08-10)
The page now opens on a **Fixtures** tab (new default): recent results and
upcoming matches across all six competitions, filterable by status and league.
- **Backend:** `GET /api/fixtures?competition=<id>&status=all|finished|scheduled`
  (`routes/fixtures.ts`, `agents/fixturesAgent.ts`). `competition` is optional —
  omitted returns every league. Uses the **live season** (shared
  `agents/liveSeason.ts`, refactored out of `previewAgent`); BSD `status=`
  fetch excludes in-progress matches, so there is no live filter. Caps: ~20
  finished (most recent) / ~30 scheduled (soonest) per league, 2 pages max;
  ~10min cache; mock path under `USE_MOCK_DATA`.
- **Frontend:** `FixturesView.tsx` — segmented ALL/FINISHED/SCHEDULED pills +
  league `IconSelect` ("All leagues" + flags). All-leagues mode groups by
  league then date; a single league groups by date. `MatchRow` shows crests,
  score (finished) or kickoff time (scheduled). Hash routes
  `#/fixtures[/<competition>][/<status>]`.
- **Navigation (superseded by §6):** clicking a **scheduled** match opened the
  Preview tab for the home team's predicted XI; a **finished** match opened
  Compare of the two clubs (resolved by display name against the standings
  list — fixtures carry preview slugs, compare needs standings slugs; see open
  item above).
- Verified live: PL scheduled = 30 (first: Arsenal vs Coventry City, 2026-08-21);
  all-leagues/all = 185 across Bundesliga, UCL, La Liga, Ligue 1, PL, Serie A.

## 6. Single-view app: fixtures landing, match → Compare ✅ DONE (2026-08-10)
The tab bar is gone — the app is now one surface with two states.
- **Scrapped `ViewTabs`** and the Fixtures/Compare/Preview switcher from the
  header (header = logo + tagline + theme toggle). Fixtures is the sole landing
  view.
- **Clicking any match row** (finished *or* scheduled) opens the full
  comparison report for the two clubs. `handleNavigate` now always resolves via
  the standings list (same display-name→slug path as before).
- **Preview removed from the UI.** The `mode === "preview"` wiring (state,
  hooks, effects, render branches) is stripped from `App.tsx`; `PreviewControls`,
  `PreviewPanel`, `usePreview` and the `preview` hash route stay in the repo but
  are unreachable. Old `#/preview/...` bookmarks parse to `null` → land on
  fixtures. Backend `/api/preview*` endpoints unchanged.
- `hash.ts`: `ViewMode` narrowed to `fixtures | compare`; `clearHash` dropped
  (only the removed switcher used it).
- Both builds green (`npm run build -w backend`, `-w frontend`).

## 7. Competition Wave 1: UEFA pair + Eredivisie, Liga Portugal, Championship ✅ DONE (2026-08-10)
The app covers 11 competitions (was 6). Everything is config + data — no agent,
orchestrator or frontend-logic changes; the whole stack derives from
`/api/competitions`.
- **`data/competitions.ts`:** added `europa-league` (BSD 8/280, af 3),
  `conference-league` (BSD 83/1607, af **848** — API-Football calls it "UEFA
  Europa Conference League"; 960 is the wrong "Euro Championship - Qual."),
  `eredivisie` (BSD 10/279, af 88), `liga-portugal` (BSD 2/305, af **94** —
  "Primeira Liga"), `championship` (BSD 12/243, af 40).
- **Verified live:** each has a completed 25/26 season with full xG standings
  (36/36/18/18/24 rows) and a live 26/27 season with fixtures (58/211/306/306/
  552). All 79 BSD leagues were inventoried; every probed candidate passes the
  same xG check (list in the OPEN item above for Wave 2).
- **Frontend:** `CountryFlag.tsx` gained Netherlands + Portugal SVGs (Championship
  reuses England, the UEFA pair reuses Europe).
- **Crests:** Eredivisie 18/18, Liga Portugal 17/18, Championship 22/24 resolve.
  The UEFA cups start lower (15/36, 20/36) because cross-border cups have no
  country fallback — coverage climbs as domestic leagues are viewed and their
  clubs land in the `seenTeams` pool; the rest degrade to monograms by design.
- **`verify.ps1`:** new Eredivisie probes (`/api/teams` + `/api/fixtures`).
  Full run green: all-leagues fixtures now 377 matches across all 11 comps.
- Both builds green; also noted the interim 502s seen from BSD during probing
  (transient — the run succeeded on retry).

## 0. Multi-competition ✅ DONE (2026-07-09)
Covers the Big-5 leagues + Champions League (was PL-only).
- `data/competitions.ts`: catalog `{id,name,country,bsdLeague,bsdSeason}` pinned
  to completed 25/26 seasons (all verified to carry xG).
- `bsd.standings(league, season)` parameterized; `listTeams(competition)`;
  `Intent`/`CompareRequest` carry `competition`.
- New `GET /api/competitions`; `GET /api/teams?competition=`; `/api/compare`
  requires a valid `competition`. Comparison is **within one competition**.
- Frontend: competition dropdown (`useCompetitions`); switching it re-defaults
  the teams. `slugify` now folds diacritics (Atlético → `atletico-madrid`).
- **Not possible via BSD:** FIFA World Cup / Euros. Only intl tournaments are
  Copa América / AFCON / Asian Cup / Gold Cup (group+knockout — not added).
- Follow-up polish: crest-colour map only covers PL clubs (others → slate grey);
  season ids are hardcoded (refresh via `GET /seasons/?league=<id>`).

## 2b. Club crests in the team pickers ✅ DONE (2026-07-21)
Teams are now picked from a visual list showing real club badges.
- **BSD has no crest artwork** (checked both `/teams/{id}/` and standings), so
  crests come from **API-Football's media CDN** via its `/teams` endpoint.
- `data/crests.ts` resolves slug → crest URL. Two providers name clubs
  differently, so matching is: exact slug → normalised (drop club-type tokens
  `fc`/`afc`/`tsg`… and bare numerals like "Bayer **04**") → unique token-subset
  containment ("Newcastle" ⊂ "Newcastle United", "Alaves" ⊂ "Deportivo
  Alaves"). **Containment is one-directional on purpose** — the reverse would
  match "Wolverhampton" to the unrelated "Wolverhampton Casuals". Ambiguous
  matches are rejected: a wrong badge is worse than a monogram. A handful of
  genuine divergences need aliases (`NAME_ALIASES`: Wolves, M'gladbach, Lyon,
  Brest, Rennes).
- Sources tried in order: league roster (small, authoritative — but the free
  plan caps at **season 2024**, so it misses newly promoted clubs) → the
  country-wide list (no season limit; filtered to senior men's sides since it
  contains U18/U21/W teams) → a process-wide index of every club seen so far
  (lets Champions League reuse crests already fetched for domestic leagues).
- **Coverage: Big-5 leagues 100%. UCL ~29/36** — the rest are clubs from
  countries we never fetch (Norway, Cyprus, Kazakhstan…) and show monograms.
- **API-Football limits: 100 requests/day AND 10 per minute.** The per-minute
  cap is easy to trip when switching competitions quickly; the country list is
  therefore only fetched when the league roster leaves gaps. Responses cache
  for 6h. Every failure path degrades to a monogram, never an error.
- Frontend: `TeamCrest` (badge with initials-monogram fallback, light chip
  behind the image so dark badges stay legible) and `IconSelect` (custom
  listbox — a native `<select>` can't render images; arrows/Home/End/Enter/
  Escape/type-ahead, closes on outside click). Crests also show in `MatchHero`.

## 2c. Country flags in the competition dropdown ✅ DONE (2026-07-21)
- **Flag emoji are unusable on Windows** — verified in-browser: 🇪🇸 renders as
  the letters "ES", and England's subdivision flag renders as a blank glyph.
  Flags are therefore **inline SVG** (`CountryFlag.tsx`), covering the six
  competition countries plus a neutral fallback. No network, no licensing.
- Each flag carries a **stroked border rect inside the SVG**. Without it,
  white-field flags (England, Italy, France) dissolve into the light theme's
  surface. A CSS `box-shadow` hairline was tried first and is too faint —
  sub-pixel at 22px wide; the stroke needs to be ≥0.13 user units.
- The EU flag's 12 stars are sub-pixel at this size, so they are drawn as dots;
  spacing is tuned so they read as a ring rather than merging into a solid cog.
- `TeamSelect` was generalised into `IconSelect` (takes `{id, label, icon}`)
  and now backs both the competition and team pickers — the old component was
  deleted rather than left as a duplicate.

## 1. Generalize beyond Arsenal/Chelsea ✅ DONE (2026-07-09)
`TeamId` is now a name-derived slug (`string`), not a fixed union. Teams are
resolved dynamically from the active provider's standings, so all 20 PL clubs
work.
- `TeamId` = slug (e.g. `manchester-city`); `types.ts` also exports `TeamSummary`.
- Deleted `teamCatalog.ts`; replaced by `data/teamDirectory.ts` (`slugify`,
  `crestColorFor`, `listTeams`). Both BSD and API-Football retrieval resolve
  slugs against their own standings rows — no hardcoded id map.
- New `GET /api/teams` endpoint; `/api/compare` validates against the live list.
- Frontend: `useTeams()` hook populates the dropdowns. **H2H is now real** for
  any pairing that has a mutual fixture (see §4) — the "no H2H" caveat below is
  superseded; empty H2H only happens when the two clubs have no shared event.

## 2. Wire team social feed → News Agent ✅ DONE (2026-07-21)
News is now real. BSD's team detail endpoint (`/api/teams/{id}/`) returns a
`social` array of ~20 recent items — **richer than expected: it's a mix of
press coverage (`type: "news"`) and the club's own tweets (`type: "tweet"`)**,
not tweets alone.
- `bsd.team(id)` added to `bsdClient.ts` (+ `BsdSocialItem`/`BsdTeamResponse`).
- `newsAgent.ts` resolves slug → BSD numeric `team_id` off the standings table
  (already cached from the retrieval agent, so it costs no extra call), fetches
  both teams' detail in parallel, and maps `social` → `NewsItem[]`.
- **Field quirk:** news items carry content in `title` (`text` empty); tweets
  carry it in `text` (`title` empty). The mapper reads whichever applies.
- `NewsItem` gained optional `source`, `url`, `kind` — the UI now attributes
  each item, links out, badges tweets with 𝕏, and shows relative times.
- **Noise filtering:** the feed is keyword-matched on club name, so it pulls in
  sportsbook odds listings and SEO/product spam ("Mj Arsenal Accessories …
  25932906 Stock Photo At Vecteezy"). Filtered by sportsbook account handle,
  `odds` in the title, and bare 5+ digit listing IDs. Also deduped by headline.
- Falls back to the curated mock on any failure (and under `USE_MOCK_DATA` /
  the API-Football provider) — news is colour, not core analysis, so it must
  never fail a comparison.
- Verified live end-to-end in the browser (Arsenal/Villa = all press;
  Newcastle = press + club tweets, emoji intact).

## 3. Swap the mock LLM for a real one — ⏸ BLOCKED on a provider decision
`llmClient.ts` ships a `MockLLMClient` that echoes its input.

**Finding (2026-07-21):** the old note that "`insightAgent.ts` won't need
changes" is **wrong**. `buildPrompt()` doesn't build a prompt — it writes the
finished paragraph, and the mock just echoes it. Wiring a real LLM therefore
requires restructuring `insightAgent.ts` into *data brief + instructions*, with
the model writing the prose. The templated text should stay as the fallback
when the LLM is unavailable.

Do the H2H copy fix (see the open list at the top) as part of that
restructure — it's the same code.

**Environment checked 2026-07-21:** no Ollama installed (not on PATH, nothing
on :11434), and `backend/.env` holds no LLM key — only BSD and API-Football.
So this can't be built and verified until one of these is chosen:
- **Gemini free tier** — free key from AI Studio, no card, works when deployed.
- **Groq free tier** — free key, very fast, open models.
- **Ollama local** — no key/account, but a ~2-5GB model download and it can't
  run on a cheap/serverless deploy (production would ship the mock).

Constraint that rules out the obvious option: the user has **Claude Pro but no
Anthropic API key**, and Pro does not grant programmatic API access.

---

## Known gaps / caveats (from the BSD integration)
- **Injuries / lineups** — now REAL (see §4): derived from a team's most recent
  finished fixture's v2 lineups payload. Still best-effort; a team with no
  finished fixture, or a failed call, degrades to `injuries: []` / no lineup.
- **Head-to-head** — now REAL for pairings with a shared event (see §4), via
  `/v2/events/{id}/h2h/`. Empty only when the two clubs have no mutual fixture
  (e.g. newly promoted sides with no recent cross-season history).
- **Possession** — no provider exposes it on free tiers; `possessionAvg` is an
  estimate derived from points/game. Attack/defense ratings use real xG.
- **Seasons** — comparisons pin to completed 25/26 seasons in
  `data/competitions.ts` (26/27 tables are empty); the Preview tab uses the
  *live* season for fixtures/predicted lineups (see §4b). Refresh season ids via
  `GET /seasons/?league=<id>`, matching the season *name* (BSD `year` is unreliable).

## Provider config reference
- BSD-only since §8g (API-Football removed).
- BSD auth: `Authorization: Token <key>`. Base: `https://sports.bzzoiro.com/api`.
- Bonus BSD data not yet used: `predictions`, `odds`, `live` (xG is used in the
  attack/defense ratings already). `predictions`/`odds` are the obvious next
  probe targets for the prediction phase.
