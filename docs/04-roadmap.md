# 04 — Roadmap

> Phased plan from empty repo to v1 launch. Phases are sequential at the milestone level but parallel-friendly inside. "Days" are working days as a rough cadence — slide if quality demands it. Vibe wins over schedule.

## Phase 0 — Foundations *(this week)*

**Goal:** docs and decisions locked, repo scaffolded, deployable hello world.

- [x] `CLAUDE.md`, `CONTEXT.md`, `design-spec.jsonc` authored
- [x] `docs/00-vision.md` · `01-srs.md` · `02-prd.md` · `03-architecture.md` · `04-roadmap.md`
- [x] `engineering/repo-structure.md` (mirrors arch §2)
- [x] `engineering/data-sources.md` (Finnhub + Alpha Vantage usage + replay schema)
- [x] Vite + TS strict + React 18 + R3F + drei scaffold
- [x] Tone.js + Zustand installed; CSS vars from `design-spec.jsonc` exported to `tokens.css`
- [x] Fraunces + Geist self-hosted via `@fontsource/*`; Departure Mono `@font-face` wired (woff2 file not yet committed — owner drops into `public/fonts/`)
- [ ] Vercel project + preview deploys on push; custom domain reserved *(owner)*
- [x] CI: typecheck, lint, color-lint, bundle-budget guard, Lighthouse-CI, axe-core
- [x] Empty `/text` route renders `content/about.md` as proof-of-pipeline
- [x] First `worklog.md` entry
- [x] Phase 0.5 review fixes applied (this work)

**Exit gate:** `pnpm dev` shows a styled, dark-themed empty desk room with one rendered cube under the right lamp, deploy-previewed live.

## Phase 1 — Layer 1, the Night Desk *(week 2–3)*

**Goal:** the cinematic landing is the entire experience for now. If we only shipped this, it would already be defensible.

### Checkpoint A — scene foundation + desk objects ✅ *(merged 2026-05-18)*
- [x] Scene boilerplate: dark room, FOV 50°, first-person desk-height camera
- [x] Lighting: warm desk lamp (key, bloom), cool monitor fills, cool rim from window
- [x] Film grain overlay (~3%)
- [x] Desk objects modeled (hand-built primitives):
  - [x] Monitor 1, Monitor 2, Mech keyboard, Coffee mug, Plant, Headphones, Notebook, Phone, Lamp, Window frame, Door spill

### Checkpoint B — interactions + panels ✅ *(merged 2026-05-22)*
- [x] Object hover state: glow + Departure Mono label
- [x] Click → camera zoom + DOM panel slide-in (480px, right side)
- [x] Panels (real content, even if short):
  - [x] ProjectPanel (driven by `content/projects.json`)
  - [x] TerminalPanel (rolling log: real recent commits via GitHub API at build time)
  - [x] NotebookPanel (renders `content/writing/*.md`)
  - [x] Phone → mailto reveal
- [x] AudioToggle wired to lo-fi loop (visible from first paint, OFF by default)

### Checkpoint C — mobile reduced-fidelity variant ✅ *(merged 2026-05-24)*
- [x] Mobile reduced-fidelity variant: ≤768px detection, raised+tilted camera, simplified keyboard, bloom disabled, tap-to-arm + tap-to-activate, full-screen panels with swipe-down close, top-right audio toggle, stepped typography
- [ ] Rain texture animated on window pane *(deferred to Phase 5 polish)*

**Exit gate:** A stranger lands cold, clicks Monitor 1 within 10s, reads a real project, leaves convinced. Lighthouse Performance ≥ 70 (relaxed from 85 per SRS NFR-4) — both `/` and `/text` clear assertions.

### Phase 1 closure — 2026-05-24 ✅

All three checkpoints merged to `main`. The Night Desk renders, eleven hand-built objects are interactive, and the mobile variant holds at 375px. Performance bar relaxed from 85 → 70 with documented rationale (CPU-throttled three.js parse dominates LCP). Deferred items live in Phase 5 polish: right-wall fill lighting, monitor screen vertical gradient, rain shader on glass, Departure Mono `.woff2` drop, localStorage audio-preference nuance, baked-poster LCP cover (Option B from the Lighthouse triage). **Phase 2 is now active.**

## Phase 2 — Data & sonification spine *(active — week 3–4, parallelizable with Phase 1 tail)*

**Goal:** the data and audio backbones are real before we render the city on top of them.

- [ ] `lib/data/types.ts` — `MarketTick`, `FeedStatus`, `SymbolMap`
- [ ] `lib/data/finnhubWs.ts` via edge proxy
- [ ] `lib/data/alphaVantageRest.ts` via edge proxy
- [ ] `lib/data/replay.ts` + first replay dataset committed to `public/replay/`
- [ ] `lib/data/orchestrator.ts` with fallback ladder + tests
- [ ] Vercel edge function `api/feed.ts` with rate-limit guard
- [ ] `marketStore` populated; "REPLAY" badge component
- [ ] `audio/engine.ts` Tone.js master bus + scene buses
- [ ] `audio/desk.ts` lo-fi loop (placeholder track) + rain swell
- [ ] Desk's window renders a tiny live indicator (e.g., the sky color already responds to index direction) — proves the spine end-to-end

**Exit gate:** Pull the network mid-session; the desk's window indicator keeps moving via replay.

## Phase 3 — Layer 2, the Voxel City *(week 4–6)*

**Goal:** the city outside the window is a place, and it breathes with the market.

- [ ] CityScene: orthographic-ish camera with slight perspective, mid-fog
- [ ] District layout: ≥3 districts (research / trading / infrastructure) with sign decals
- [ ] Building component: instanced mesh, per-instance height/color/light-density/pulse-phase
- [ ] Symbol → building mapping committed in `content/symbols.json`
- [ ] Live mapping wired (height, color tint, window density, pulse rate, sky color, skyline glow)
- [ ] Window-from-desk now shows the actual city scene at reduced res (0.4×, fps-capped)
- [ ] Camera enters via 2–3s glide from desk; deep-link `/city` plays 1.2s fade-in
- [ ] Building hover → callout: symbol + live price (Departure Mono)
- [ ] Building click → zoom into building → project list for that district
- [ ] `audio/city.ts`: pad keyed to index direction, bass tempo from VIX, trade ticks
- [ ] Reduced-motion: no drift, no pulse, no glide
- [ ] Mobile: lower instance count, simplified pulse, no traffic streams

**Exit gate:** During market hours, watching the city for 30s feels alive in a way that maps to the actual market.

**Phase 3 risk — window rim-light interplay shifts when the real city lands.**
Checkpoint A ships a placeholder "city beyond" (two stacked emissive planes at `VOXEL_GLOW_SOFT`, intensity 1.4/0.55) visible through the right-wall window. When Phase 3 replaces it with the real voxel skyline — hundreds of individual building lights — the average luminance behind the glass will change, possibly significantly. The wall area around the window may suddenly read brighter (many lit windows) or dimmer (depending on the city's average luminance vs. the placeholder). The desk scene's rim-light balance (currently `VOXEL_GLOW_SOFT` DirectionalLight at intensity 1.2) will likely need a re-tune once the real city is in. Not a bug — a planned iteration. Budget a desk-scene lighting re-verification pass when the window-from-desk render goes live.

## Phase 4 — Layer 3, the Neural Network *(week 6–7)*

**Goal:** the deep-dive reads as architectural and reverent, not gamey.

- [ ] NnScene: long parallel halls, FOV 60°, first-person walk
- [ ] Resolve D1 (transformer vs MLP) — recommend a 4-layer transformer encoder for geometric variety + recognizability
- [ ] Hall geometry: instanced columns for attention heads
- [ ] Neuron wall-lights with subtle pulse on entry
- [ ] Token-path streams as glowing splines flowing through the hall
- [ ] Chamber prefab: side room, single firing neuron on entry
- [ ] Chamber content: project markdown rendered onto a wall panel (CSS HTML in a Drei `<Html>` works for v1)
- [ ] Door entry from desk + designated building entry from city
- [ ] `audio/nn.ts`: long sustained tones, no rhythm
- [ ] Mobile: simplified geometry, reduced lights, walk-via-tap-waypoints

**Exit gate:** Walking the NN doesn't feel like a video-game level; it feels like a building.

## Phase 5 — Content + a11y + perf pass *(week 7–8)*

- [ ] Final 6+ projects authored in `content/projects/`
- [ ] `about.md`, ≥2 writing pieces
- [ ] District list finalized (resolve PRD Q2)
- [ ] OG image rendered + verified in Twitter/Facebook debuggers
- [ ] `/text` route fully populated; `<link rel="alternate">` from all 3D routes
- [ ] Keyboard nav verified scene-by-scene; focus rings consistent
- [ ] `prefers-reduced-motion` audit
- [ ] Contrast audit (paper-on-night ≥7:1, amber-on-night ≥4.5:1)
- [ ] Lighthouse: perf ≥85, a11y ≥95 on `/` and `/text`
- [ ] Bundle: initial ≤200KB gzipped; per-scene budgets met
- [ ] 30-second audio test passes
- [ ] Disconnect test passes

## Phase 5.5 — Soak *(½ week)*

**Goal:** absorb the slip that polish phases always create, before the world sees it.

- [ ] External user test #1 — one Tier 1 (recruiter / hiring manager) audience member, fresh eyes, 30-second + 5-minute tests
- [ ] External user test #2 — one Tier 2 (engineer / researcher) audience member, time on each layer
- [ ] 24-hour live preview soak on the production domain *before* public announcement (catches CDN, font-loading, fallback bugs that don't appear locally)
- [ ] Final pass on OG image rendering and meta tags (verified via Twitter + Facebook debuggers against the production URL)
- [ ] Disconnect test re-verified on the deployed build (not just local) — pull the network mid-session, confirm the city continues via replay
- [ ] 30-second audio test re-verified on the deployed build (CDN-served audio, not local files)
- [ ] Mobile soak: open the production URL on a real iPhone 12-era device and an Android mid-range; verify all three layers and the audio toggle

## Phase 6 — Launch

- [ ] PRD §8 launch checklist green
- [ ] Custom domain + HTTPS live
- [ ] Soft-share to a small circle first; watch for 24h
- [ ] Then HN / X / wherever

## Post-v1 backlog *(parking lot)*

- P3 user stories U24–U28 from the PRD
- A `/sound` mixer route
- Custom WebGL rain-on-glass shader
- A second replay dataset for a *different* day (e.g., a crash day for atmosphere)
- The easter eggs — keep them undocumented, intentionally

## Risks and how we respond

| Risk | Trigger | Response |
|---|---|---|
| Performance budget broken by city instance count | <45fps on a mid mobile | Drop fidelity tier, reduce visible buildings, ship anyway |
| Sonification becomes annoying | 30s test fails | Lower gains, widen rhythm spacing, simplify pad voicing — do not cut the feature |
| Finnhub free tier too restrictive | 429s in dev | Heavier edge cache; subscribe ~$0–10/mo only if essential |
| Vercel WS proxying flaky | Drops in preview | Switch to signed-URL client-direct WS (D3) |
| Aesthetic drift | A PR introduces purple, glass-morphism, etc. | Reject. Re-read `design-spec.jsonc`. |
| Three-layer scope is too big for one builder | Slipping past the Phase 5.5 soak | Slip the launch, not the layers. Two-layer launch breaks the thesis. (The Phase 5.5 buffer absorbs normal polish slip; only structural overrun triggers this row.) |

## How we know we shipped the right thing

Two months after launch, when someone says "have you seen [this site]?", they're describing the voxel city or the neural net hallway — not "a 3D portfolio." The metaphor is what travels.
