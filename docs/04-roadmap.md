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

## Phase 2 — Data & sonification spine ✅ *(closed 2026-05-25)*

**Goal:** the data and audio backbones are real before we render the city on top of them.

**Q6 resolution:** Option A (replay-first, no live WS). Reasoning: free-tier Finnhub embeds the key in the WS URL → key exposure on a public site; Alpha Vantage's 25-calls/day cap makes Option B effectively replay anyway; the structural cost of supporting two modes (Option C) exceeded the marginal benefit. The orchestrator's interface preserves the upgrade path — Phase 5 can swap in a live adapter without changing consumers.

### Checkpoint A — types + replay layer ✅ *(merged 2026-05-24)*
- [x] `lib/data/types.ts` extended (`MarketTick`, `FeedStatus` with `loopStartTs`, `IndexSnapshot` with `ts`, `IndexDirection`, `MarketSession`, `SymbolMap`, `ReplayDataset`)
- [x] `lib/data/replay.ts` — adapter that walks a committed tape in real-time and loops with fresh `loopStartTs`
- [x] `scripts/generate-synthetic-replay.mjs` — mean-reverting GBM + spikes → 33 tickers, ~5000 ticks, 392 KB
- [x] `scripts/capture-replay.mjs` — owner-action, native Node 22 WebSocket, no third-party deps
- [x] `/debug/replay` verification route

### Checkpoint B — orchestrator + marketStore + window indicator ✅ *(merged 2026-05-25)*
- [x] `lib/data/orchestrator.ts` — replay-only impl with `TODO(phase-5)` cross-ref to `03-architecture.md §9` for the deferred live path
- [x] `lib/data/clock.ts` — `getSession()` from NY local time via `Intl`
- [x] `lib/stores/marketStore.ts` — Zustand with `applyTick`/`applyIndex`/`setSession`/`setStatus`; map-clone on tick so shallow selectors work
- [x] `FeedStatusBadge` — bottom-left REPLAY badge with the on-brand honesty tooltip, fades to 0 when a panel is focused
- [x] Window indicator — city emissive lerps on `index.direction`; sky emissive lerps on `MarketSession`; both read `useMarketStore.getState()` inside `useFrame`, snap under reduced-motion
- [x] Dev hooks namespaced under `window.__market` (phase-agnostic)

### Checkpoint C — sonification ✅ *(merged 2026-05-25)*
- [x] `audio/engine.ts` rewritten — per-scene gain buses with 1.5s crossfade, master = Gain 0.3 → 5 kHz lowpass → Chebyshev(2, wet 0.15) tape-coded saturation
- [x] Pad voice — triangle PolySynth → LFO-modulated lowpass → reverb; mode by `index.direction` (aeolian/lydian/phrygian cycles); 1.5s portamento between chord triggers
- [x] Bass voice — sine sub at chord-root; `Transport.bpm` ramps 4s to 60/68/80/92 BPM by VIX bucket
- [x] Tick percussion — pink-noise burst through bandpass at 2.2 kHz; fires on ticks above p95-of-60s rolling volume threshold; panned by ticker first-letter charcode
- [x] Reduced-motion: pad glide → 3s, BPM held at 60, tick percussion silenced
- [x] `marketStore.subscribeTickEvent` side-channel for the engine (avoids storing every tick in Zustand state)
- [x] FR-26 preserved — audio off by default, Tone.js stays dynamic-import, build/start only inside user-gesture stack

**Exit gate (met):** Pull the network mid-session; the desk's window indicator keeps moving via replay, the sonification continues uninterrupted.

## Phase 3 — Layer 2, the Voxel City *(week 4–6)*

**Goal:** the city outside the window is a place, and it breathes with the market.

### Checkpoint A — foundation ✅ *(merged 2026-05-25)*
- [x] CityScene composition (sky dome shader, FogExp2, hemisphere ambient, moon directional, ambient)
- [x] Session-driven sky horizon (6s lerp, ShaderMaterial with linear→sRGB encode)
- [x] River (emissive strip at x=0, slow sine breath)
- [x] CityBloom postfx (river only)

### Checkpoint B — buildings ✅ *(merged 2026-05-26)*
- [x] Build-time GitHub fetch with per-repo + top-level cache + cache-rebuild fallback
- [x] Buildings driven by real public repos (23 from `defurl`)
- [x] District layout (spiral, tallest-center, deterministic jitter)
- [x] Style → silhouette + roof variants (industrial / fortress / glass / etc.)
- [x] Per-district color tint, archive dimming, runtime pulse from `index.direction`
- [x] Drei Billboard + Text district labels

### Checkpoint C — interactions ✅ *(merged 2026-05-27)*
- [x] Hover-and-pan camera with parallax trail + orbital drift
- [x] District label click → 2.5s ease-in-out glide (Y=18, Z+32, isometric)
- [x] Building hover (gated to in-district close-range), +20% emissive lift, debounced 200ms, drei `<Html>` callout
- [x] Building click → ProjectPanel reuse with lazy README fetch via marked
- [x] Centralized layout in `lib/content/buildings.ts` (`getPlacedBuildings()`, `findPlaced`, `districtOf`)
- [x] Collision-free dynamic building pose (`bH * 0.65 + 3` altitude, `bz + 10` z-offset)
- [x] Context-aware back affordance: building → district → overview → desk

### Checkpoint D — transitions ✅ *(merged 2026-05-28)*
- [x] Desk window click → 1.5s glide + 300ms fade-to-black + navigate
- [x] City entry from south pose, 2s glide to overview with 1.2s fade-in
- [x] `/city` deep-link with 1.2s fade-in from BG_VOID
- [x] Back-to-desk affordance (overview mode) with 300ms fade + navigate
- [x] OG image rendered (1200×630) committed to `public/og-city.png`
- [x] `dist/city/index.html` emitted with city-specific og:image/title/description
- [x] Reduced-motion: all glides + fades skipped, immediate navigation

**Phase 3 closure — 2026-05-28 ✅**

All four checkpoints merged. The city renders, breathes with the market, and is reachable via both desk-window and `/city` URL. Carried forward to Phase 5 polish: desk-wake-up sequence on `/`-from-`/city` deep-link, OG image render with overlay affordances hidden, instanced per-window meshes (current build uses single emissive box per building), live-data adapter ladder, mobile city. **Phase 4 is now active.**

**Phase 3 risk — window rim-light interplay shifts when the real city lands.** [original risk note retained] When the real voxel skyline replaces the desk window's placeholder, the desk's rim-light balance may need a re-tune. Budget a desk-scene lighting re-verification pass when window-shows-real-city ships (Phase 5 work).

## Phase 4 — Layer 3, the Neural Network *(week 6–7)*

**Goal:** the deep-dive reads as architectural and reverent, not gamey.

### Checkpoint A — hall architecture & scene foundation ✅ *(merged 2026-05-29)*
- [x] Lazy /nn route + CSS-only flickering-corridor fallback
- [x] Tadao Ando concrete corridors (4 layer segments + 1.5m light-shaft gaps)
- [x] Instanced attention-head columns along walls
- [x] First-person eye-level walk (y=1.65m, FOV 60°, WASD + drag-look, clamped)
- [x] FogExp2 + hemisphere + 4 directional shafts
- [x] Prerender dist/nn/index.html with nn-specific meta

### Checkpoint B — activations & token splines ✅ *(merged 2026-05-30)*
- [x] Wall-embedded neuron lights (instancedMesh, alternating amber/cool, breathing pulse)
- [x] Token-path particle splines along CatmullRomCurve3 paths
- [x] U20 hi-fi toggle (gates bloom, particle density, dynamic shadows)
- [x] `NnFidelityToggle` overlay
- [x] Reduced-motion: lights lock, particles freeze

### Checkpoint C — project chambers & live inference ✅ *(merged 2026-05-31)*
- [x] Gap-placed concrete chambers (3 projects + 1 inference room)
- [x] Entry-trigger neuron activation flash (emissive 8.0 → 1.0 over 0.8s)
- [x] Drei `<Html>` project wall-panels with ProjectPanel-coded typography
- [x] U24 live transformer attention-head visualizer (typed prompt → 4-layer forward pass over SVG attention grid)

### Checkpoint D — transitions, audio & mobile ✅ *(merged 2026-06-01)*
- [x] Desk → /nn doorway click (transparent hit area at door-spill position)
- [x] City → /nn neural gateway building (Intel-TradingAgent)
- [x] `NnBack` overlay (back-to-desk with fade + navigate)
- [x] NN drone bus (A1/E2/B2 oscillators, LFO-modulated lowpass, long reverb)
- [x] Traversal-modulated filter cutoff (`NnAudioBridge` reads camera.z, ramps 380→1280 Hz)
- [x] 1.5s scene crossfade reused from engine `setScene()` path
- [x] Mobile tap-to-walk waypoints (floor rings, per-layer, glide via nnWalkTarget ref)

**Phase 4 closure — 2026-06-01 ✅**

All four checkpoints merged. The full walkthrough (Desk → Voxel City → Neural Network → Project Chamber → back) runs end-to-end with audio scene crossfades, reduced-motion fallbacks, and a mobile tap-to-walk model. Carried forward to Phase 5 polish: distinct visual treatment for the neural gateway building, NN ear-test tuning, instanced per-window meshes in city, content authoring.

**Exit gate (met):** Walking the NN doesn't feel like a video-game level; it feels like a building.

## Phase 5 — Content + a11y + perf pass *(week 7–8)*

- [x] Final 6+ projects authored in `content/projects/` *(2026-06-04, PM)*
- [x] `about.md`, ≥2 writing pieces
- [x] District list finalized — softwares / coursework / ml / others *(2026-06-03)*
- [ ] OG image rendered + verified in Twitter/Facebook debuggers
- [x] `/text` route fully populated; `<link rel="alternate">` from all 3D routes
- [x] Keyboard nav on desk objects with focus-visible amber outline *(2026-06-04)*
- [x] `prefers-reduced-motion` audit — gateway beam, NN, city all gated
- [ ] Contrast audit (paper-on-night ≥7:1, amber-on-night ≥4.5:1)
- [ ] Lighthouse: perf ≥85, a11y ≥95 on `/` and `/text`
- [x] Bundle: initial ≤200KB gzipped *(69.4KB at last check)*
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
