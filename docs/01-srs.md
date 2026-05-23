# 01 — Software Requirements Specification

> Functional and non-functional requirements for the v1 MVP. Every requirement is tagged so it can be referenced from the PRD, roadmap, and PR descriptions.

Tag legend: **FR-x** functional · **NFR-x** non-functional · **DR-x** data · **AR-x** accessibility · **SR-x** SEO/sharing.

---

## 1. Scope

The system is a single-page 3D portfolio website with three discrete, lazy-loaded scenes ("layers") and a non-3D fallback route. It consumes a live market data feed, sonifies it, and renders project content drawn from version-controlled markdown/JSON. There is no backend other than (a) a thin Vercel edge function to proxy/sign market-data requests and (b) static asset hosting.

## 2. Actors

- **Visitor — first-time, scrolling timeline (Tier 4):** lands on the desk, sees the window, leaves in ≤30s with a screenshot-worthy impression.
- **Visitor — recruiter (Tier 1):** wants role-relevant signal fast. Reaches projects via Monitor 1 or `/text` route.
- **Visitor — engineer (Tier 2):** explores all three layers, reads project writeups, tries demos.
- **Visitor — assistive-tech user:** uses `/text` route or keyboard-driven 3D paths.
- **Operator (the developer):** edits `content/`, redeploys via Vercel, monitors feed health.

## 3. Functional Requirements

### 3.1 Scene management

- **FR-1.** The application loads the **Night Desk** scene as the default route (`/`).
- **FR-2.** Each scene (Desk, City, NN) is **code-split**; entering a scene for the first time triggers its bundle to load. Layer 3 must not be in the initial bundle.
- **FR-3.** Scene transitions are explicit camera/scene changes (1.5–3s, see motion spec). The URL updates to `/`, `/city`, `/nn` respectively (history.pushState; back/forward buttons restore prior scene).
- **FR-4.** A user can return to the desk from any scene via a persistent quiet "back to desk" affordance (Departure Mono, bottom-left, amber on hover).
- **FR-5.** A loading state (quiet progress bar, no rotating tips) covers any scene load >300ms.

### 3.2 The Night Desk (Layer 1)

- **FR-6.** Renders a first-person view at desk height, FOV 50°, with the objects listed in CONTEXT.md §Layer 1.
- **FR-7.** Each navigable object exposes a hover state (glow + one-word label in Departure Mono).
- **FR-8.** Click/Enter on an object zooms the camera and reveals the associated content panel sliding in from the right (~480px wide; see composition rules).
- **FR-9.** Object → action mapping:
  - Monitor 1 → projects index
  - Terminal → live activity / about / writing
  - Notebook → research, sketches, longer-form writing
  - Headphones → toggles sonification audio (global)
  - Phone → reveals contact (flips face-up)
  - Window → transitions to **Voxel City**
  - Door (off-frame, light hint) → transitions to **NN walkthrough**
- **FR-10.** The window continuously renders the voxel-city skyline as a live secondary view at reduced resolution (≤30fps acceptable for the windowed view).
- **FR-11.** Rain texture animates on the window pane; intensity varies on a 60–120s envelope. Never global.
- **FR-12.** The desk lamp is the only warm key light; monitors are cool fills; the window provides rim light.

### 3.3 The Voxel City (Layer 2)

- **FR-13.** Camera enters via a 2–3s glide from the desk window; on direct deep-link load (`/city`) the entry plays a 1.2s fade-in instead.
- **FR-14.** The city is composed of voxel buildings rendered via **instanced meshes** (one draw call per building type).
- **FR-15.** Per-building visuals are driven by **live market data** (mapping below; see DR-3):
  - height ← market cap (or sector aggregate)
  - window-light density ← trading volume
  - vertical light pulse rate ← volatility
  - color tint ← today's price change (green up / amber flat / red down, muted)
  - distant skyline glow ← index direction
  - traffic streams between districts ← capital flow / sector rotation
  - sky color & star density ← time of day in NY market hours
- **FR-16.** Districts correspond to project categories (research, trading, infrastructure, …). Clicking a building zooms in; clicking a district sign opens the project list for that category.
- **FR-17.** Camera supports slow drift baseline + free fly within constrained orbit. Aggressive moves disabled.
- **FR-18.** A single building (designated) is the entrance to the **NN walkthrough** in addition to the desk's door hint.

### 3.4 Inside the Neural Network (Layer 3)

- **FR-19.** Renders an architecturally styled transformer/MLP: long halls of attention heads, neurons as wall-embedded lights, glowing token-path streams.
- **FR-20.** Camera is first-person walk, FOV 60°, head-bob disabled, WASD + arrow keys + on-screen prompts for mobile.
- **FR-21.** Each project occupies a "chamber" (side room). Entering triggers a single neuron firing + reveals: title, one-line thesis, markdown writeup, links (repo/paper/demo), optional live demo embed.
- **FR-22.** Project content is loaded from `content/projects/*.md` + `content/projects.json` index. No CMS.

### 3.5 Audio / sonification

- **FR-23.** Audio is **OFF on first paint**. The toggle (headphones object on the desk + a persistent corner toggle) is the most prominent affordance.
- **FR-24.** Once enabled, audio respects scene:
  - Desk: lo-fi loop at 0.3 gain, distant city hum, occasional rain swell.
  - City: ambient pad keyed to index direction, bass tempo tracking VIX, soft percussive ticks on significant trades.
  - NN: long sustained tones, sparse, reverent — no rhythm section.
- **FR-25.** Audio crossfades during scene transitions (1.5s).
- **FR-26.** The audio enabled/disabled preference is persisted in `localStorage` across sessions, but audio playback never starts without a user gesture in the current page session — even if the prior preference was "enabled." On page load, the toggle reflects the persisted preference visually, but the audio context remains uninitialized until the user explicitly engages the toggle (or any other element that grants audio permission).

### 3.6 Content

- **FR-27.** Projects, writing, and about copy live in `content/`:
  - `content/projects.json` (index with id, title, category, district, thesis, links, asset paths)
  - `content/projects/<id>.md` (longform)
  - `content/writing/<slug>.md`
  - `content/about.md`
- **FR-28.** Content is read at build time (Vite static import) — no runtime CMS calls.

### 3.7 Fallback / text route

- **FR-29.** `/text` renders all project, writing, and contact content as a single accessible HTML document — no WebGL, no audio, no 3D dependencies in its bundle.
- **FR-30.** A "no-WebGL detected" banner on `/` offers a one-click jump to `/text`.

### 3.8 Contact

- **FR-31.** Contact is a `mailto:` link revealed when the phone object is flipped face-up. No form.

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **NFR-1.** Sustained ≥60fps on a 2021 MacBook Air at 1440×900 in the Desk scene; ≥45fps in City and NN.
- **NFR-2.** Initial JS payload ≤ **200KB** gzipped (excluding 3D model/texture assets).
- **NFR-3.** LCP ≤ **2.5s** on a 4G throttled connection (Lighthouse mobile).
- **NFR-4.** Lighthouse Performance ≥ **70** on the landing route. *Relaxed from 85 (2026-05-24) — Layer 1 is a hand-built WebGL scene shipping three.js + @react-three/fiber + drei + postprocessing. Lighthouse's default 4× CPU throttle makes the post-network three.js parse + first-frame render dominate LCP, and that cost is intrinsic to the medium. Network-side mitigations (lazy-loading, `modulepreload` hint for the desk chunk) are in place. Text-route fallback at `/text` scores ≥90 — every visitor still has a fast path to the content.*
- **NFR-5.** Pixel ratio capped at 2; opt-in "high fidelity" toggle for higher.
- **NFR-6.** Scene assets total: Desk ≤ 4MB, City ≤ 6MB, NN ≤ 5MB (compressed).
- **NFR-7.** Texture atlases over per-object textures; KTX2/Basis where supported.

### 4.2 Reliability & graceful degradation

- **NFR-8.** Market data outage or rate limit → automatic fallback to cached/replayed dataset; UI surfaces a tiny "replay" badge (Departure Mono, faint).
- **NFR-9.** Audio context blocked by browser → visuals continue uninterrupted; toggle reflects unavailable state.
- **NFR-10.** WebGL unavailable → automatic redirect to `/text` (or a banner if detection is post-mount).
- **NFR-11.** No critical-path runtime errors result in a blank page; an error boundary renders a quiet fallback in the same aesthetic.

### 4.3 Maintainability

- **NFR-12.** TypeScript strict mode; no `any` without `// reason:` comment.
- **NFR-13.** Component files PascalCase; hooks `useFoo.ts`; stores `fooStore.ts`.
- **NFR-14.** Three.js access via drei abstractions over raw THREE where possible.
- **NFR-15.** Shaders in `src/shaders/` as `.glsl` imported via `vite-plugin-glsl`.
- **NFR-16.** All meaningful changes append an entry to `worklog.md`.
- **NFR-17.** Maintenance budget: site should require attention ≤ once per quarter to stay alive.

### 4.4 Security & privacy

- **NFR-18.** No analytics, tracking pixels, session replay, or third-party fonts that phone home with PII.
- **NFR-19.** No cookies set by first-party code. (No banner required.)
- **NFR-20.** Market-data API keys live in Vercel env vars; never shipped to the client. A thin edge function proxies + caches.
- **NFR-21.** All third-party assets (fonts, models, audio samples) are self-hosted or via privacy-respecting CDNs.

### 4.5 Cost

- **NFR-22.** Target $0/mo infra; hard ceiling $10/mo if forced.
- **NFR-23.** Edge function invocations stay within Vercel free tier (rate-limit + cache aggressively).

### 4.6 Browser support

- **NFR-24.** Latest 2 versions of Chrome, Firefox, Safari, Edge. iOS Safari 16+. Chrome Android current.
- **NFR-25.** Fail gracefully (→ `/text`) on browsers without WebGL2.
- **NFR-26.** Lighthouse Accessibility score ≥ **95** on `/` and `/text`.

---

## 5. Data Requirements

- **DR-1.** Primary feed: **Finnhub WebSocket** (free tier). Symbols: ~30 large caps mapped to project districts + index proxies (SPY, QQQ, VIX).
- **DR-2.** Fallback feed: **Alpha Vantage REST** (free tier) polled every 60s.
- **DR-3.** Cached replay dataset: a 1-trading-day JSON, refreshed weekly by an offline script and committed; loaded when (a) market closed, (b) both feeds fail, (c) user is on `/text`.
- **DR-4.** All feed access is mediated by `lib/data/` adapters that normalize to a `MarketTick` shape consumed by the city renderer.
- **DR-5.** The data layer is **decoupled from rendering** via a Zustand store; renderers subscribe.

## 6. Accessibility Requirements

- **AR-1.** All critical paths reachable by keyboard. Focus rings are amber, 2px, on every focusable target.
- **AR-2.** `prefers-reduced-motion: reduce` — kills camera glides (replace with crossfades), ambient drift, and bloom pulses.
- **AR-3.** `/text` route is fully screen-reader-friendly: semantic landmarks, skip links, alt text for any images.
- **AR-4.** Audio is opt-in and never auto-plays.
- **AR-5.** Color contrast: paper-text on bg-night ≥ 7:1; amber on bg-night ≥ 4.5:1. Verified in CI via a contrast lint script.
- **AR-6.** All interactive 3D objects expose an equivalent in the DOM with `role="button"` and an accessible name, even if visually hidden.

## 7. SEO / sharing

- **SR-1.** OpenGraph + Twitter card images: a single high-quality desk render (`/og.png`, 1200×630).
- **SR-2.** `<title>` and meta description reflect the north-star sentence (one variant per scene).
- **SR-3.** `/text` is fully indexable; the 3D routes link to it via `<link rel="alternate">`.
- **SR-4.** No JS required to read content (everything visible on `/text`).

---

## 8. Out of scope for v1

- A blog CMS / admin UI
- User accounts, login, comments
- A fourth scene/layer
- Internationalization (English only)
- A4-printable resume export (intentional — see Vision)
- Analytics dashboards
