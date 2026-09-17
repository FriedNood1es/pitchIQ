# PitchIQ — Next Steps

_Last updated: 2026-09-17_

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
- [ ] **Crest-colour map only covers PL clubs** (`data/teamDirectory.ts`
  `CREST_COLORS`); La Liga/Serie A/etc. fall back to slate grey. Since §8g
  removed real crests, the monogram **is** the team identity now — extending
  the map to the other 10 competitions' clubs is the only lever for colour
  fidelity (decorative, never an error).
- [ ] **Insight copy degrades badly with no H2H.** With the curated H2H empty for
  most pairings, the mock insight emits "Over the last 0 meetings, Arsenal have
  won 0 and Aston Villa have won 0." Suppress the H2H clause when there are no
  meetings (worth fixing whether or not the LLM stays mocked).
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
  - **H2H aggregates** — BSD's `v2/events/{id}/h2h/` returns `home_win_rate`,
    `away_win_rate`, `draws`, `avg_total_goals`, `total_matches`, but the
    compare panel only shows the last-5 results. Surfacing the rates is a
    direct implied-outcome + over/under signal (`fetchH2h` in
    `dataRetrievalAgent.ts` currently drops them).
  - **Next-match predicted XI in Compare** — reuse `/predicted-lineup`
    (already used by the team-dashboard preview) so compare shows each club's
    predicted starters with per-player `ai_score` (0-100), availability and
    formation confidence; compare currently shows the *last finished* lineup.
  - **Raw xG numbers** — `xgf`/`xga`/`xgd` per game are folded into the 0-100
    attack/defense ratings only (`bsdRowToStats`); expose them as numbers.
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
