# 03 — Architecture

> System shape, data flow, and module boundaries for the v1 MVP. Lean: a single Vite + React app, three lazy-loaded R3F scenes, a Zustand store, and a thin Vercel edge function for market data. No backend services, no database.

## 1. System diagram

```
                ┌────────────────────────────────────────────────────────────┐
                │                        Browser                              │
                │                                                            │
                │   ┌────────────┐    ┌─────────────────────────────────┐   │
                │   │  /         │    │       Zustand stores            │   │
                │   │  /city     │    │  marketStore · audioStore       │   │
                │   │  /nn       │◀──▶│  sceneStore · contentStore      │   │
                │   │  /text     │    │  (single source of truth)       │   │
                │   └─────┬──────┘    └────────────┬────────────────────┘   │
                │         │                        │                         │
                │    Route shell (React)           │ subscribe               │
                │         │                        ▼                         │
                │   ┌─────▼──────────┐  ┌───────────────────┐               │
                │   │ Scene <Canvas> │  │  Audio engine     │               │
                │   │  (R3F + drei)  │  │  (Tone.js + WebAudio)            │
                │   │  lazy-loaded   │  │  scene-aware mix  │               │
                │   └─────┬──────────┘  └───────────────────┘               │
                │         │                                                  │
                │   ┌─────▼─────────┐   ┌────────────────┐                  │
                │   │ DOM overlay   │   │  /text route   │                  │
                │   │ panels (CSS)  │   │  (no R3F bundle)                  │
                │   └───────────────┘   └────────────────┘                  │
                │                                                            │
                │   ┌────────────────────────────────────────────┐          │
                │   │  Data adapter layer (lib/data/)             │          │
                │   │  - finnhubWs · alphaVantageRest · replay    │          │
                │   │  → normalized MarketTick stream             │          │
                │   └──────────────┬──────────────────────────────┘          │
                └──────────────────┼─────────────────────────────────────────┘
                                   │ WSS / HTTPS
              ┌────────────────────▼──────────────────────────┐
              │  Vercel Edge Function   /api/feed              │
              │  - holds API keys (env)                        │
              │  - rate-limits + caches (KV-less, in-memory)   │
              │  - proxies Finnhub WS + Alpha Vantage REST     │
              └────────────────────┬──────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              ┌──────────┐                  ┌──────────────┐
              │ Finnhub  │                  │ Alpha Vantage │
              │   WS     │                  │     REST      │
              └──────────┘                  └──────────────┘
```

## 2. Module layout (high-level)

```
/
├── public/
│   ├── models/                    # GLB/KTX2 assets (LFS if >1MB)
│   ├── audio/                     # OGG/MP3 samples + loops
│   ├── replay/2024-XX-XX.json     # cached market dataset
│   └── og.png
├── content/
│   ├── projects.json              # index
│   ├── projects/*.md              # per-project longform
│   ├── writing/*.md
│   └── about.md
├── src/
│   ├── main.tsx                   # entry, root, route shell
│   ├── routes/
│   │   ├── DeskRoute.tsx          # /
│   │   ├── CityRoute.tsx          # /city  (lazy)
│   │   ├── NnRoute.tsx            # /nn    (lazy)
│   │   └── TextRoute.tsx          # /text  (no R3F)
│   ├── scenes/
│   │   ├── desk/                  # Layer 1
│   │   │   ├── DeskScene.tsx
│   │   │   ├── objects/           # Monitor, Terminal, Notebook, Phone, Window, Door, Headphones
│   │   │   └── lighting.ts
│   │   ├── city/                  # Layer 2
│   │   │   ├── CityScene.tsx
│   │   │   ├── Building.tsx       # one instance per voxel building
│   │   │   ├── districts.ts
│   │   │   └── sky.ts
│   │   └── nn/                    # Layer 3
│   │       ├── NnScene.tsx
│   │       ├── Hall.tsx
│   │       ├── Chamber.tsx
│   │       └── neurons.ts
│   ├── overlay/                   # DOM-side panels and HUD
│   │   ├── ProjectPanel.tsx
│   │   ├── TerminalPanel.tsx
│   │   ├── NotebookPanel.tsx
│   │   ├── AudioToggle.tsx
│   │   └── BackToDesk.tsx
│   ├── audio/
│   │   ├── engine.ts              # Tone.js singleton + master bus
│   │   ├── desk.ts                # lo-fi loop, rain swell
│   │   ├── city.ts                # pad + bass + ticks (sonification)
│   │   └── nn.ts                  # sustained tones
│   ├── lib/
│   │   ├── data/
│   │   │   ├── types.ts           # MarketTick, SymbolMap, FeedStatus
│   │   │   ├── finnhubWs.ts
│   │   │   ├── alphaVantageRest.ts
│   │   │   ├── replay.ts
│   │   │   └── orchestrator.ts    # picks primary/fallback/replay
│   │   ├── stores/
│   │   │   ├── marketStore.ts
│   │   │   ├── audioStore.ts
│   │   │   ├── sceneStore.ts
│   │   │   └── contentStore.ts
│   │   ├── content/
│   │   │   └── load.ts            # build-time import.meta.glob
│   │   └── motion/
│   │       └── reducedMotion.ts
│   ├── shaders/
│   │   ├── window-rain.glsl
│   │   ├── city-fog.glsl
│   │   └── neuron-glow.glsl
│   └── styles/
│       ├── tokens.css             # CSS vars from design-spec.jsonc
│       └── globals.css
├── api/
│   └── feed.ts                    # Vercel edge function (proxy + cache)
├── docs/                          # this folder
├── engineering/                   # repo-structure.md, data-sources.md, etc.
├── design-spec.jsonc
├── CONTEXT.md
├── CLAUDE.md
└── worklog.md
```

## 3. State management (Zustand)

Four stores, each with a single responsibility. No Context-as-state. No prop drilling for global concerns.

| Store | State | Writers | Readers |
|---|---|---|---|
| `marketStore` | `Map<symbol, MarketTick>`, `feedStatus`, `indexDirection`, `vix` | `lib/data/orchestrator` | City scene, terminal panel, audio (city.ts) |
| `audioStore` | `enabled: boolean`, `scene: 'desk'\|'city'\|'nn'`, `masterGain` | AudioToggle, sceneStore subscriber | `audio/engine`, audio modules |
| `sceneStore` | `current`, `transitioning`, `prefersReducedMotion` | Route components | Scene components, audio engine |
| `contentStore` | `projects: ProjectIndex[]` (eager), `bodies: Map<id, string>` (lazy-filled), `writing`, `about` | `lib/content/load` (init + on-demand body fetch) | Overlay panels, `/text` route |

Subscriptions use selector + shallow-compare to keep R3F frames cheap.

## 4. Data flow — market feed

1. **Boot:** `lib/data/orchestrator` starts. Attempts Finnhub WS via the edge proxy (`/api/feed?source=finnhub`).
2. **On message:** raw payload → normalize to `MarketTick { symbol, price, change, volume, ts }` → `marketStore.applyTick()`.
3. **On error / silent for 15s:** fall back to Alpha Vantage REST (60s poll via edge proxy).
4. **On both failing:** load `public/replay/<latest>.json` and stream ticks at real-time playback speed; flip `feedStatus = 'replay'`.
5. **On market closed (detect via NY clock):** start in replay mode immediately. Surface a faint "REPLAY · MM/DD" badge in the bottom-left.
6. **Renderers subscribe** to `marketStore` via selectors. Per-frame updates in R3F are throttled (max 10Hz for visual smoothing).

## 5. Data flow — audio

1. `audioStore.enabled` flips → `audio/engine` boots Tone.js context (requires user gesture; first toggle counts).
2. `sceneStore.current` changes → engine crossfades scene buses (1.5s).
3. City module subscribes to `marketStore.indexDirection` and `marketStore.vix` → modulates pad key + bass tempo.
4. Significant trade events (configurable threshold) emit a percussive tick at low gain.
5. On scene exit, the leaving bus fades; samples are released; no overlap.

## 6. Routing

- React Router v6, four routes (`/`, `/city`, `/nn`, `/text`).
- `/city` and `/nn` use `React.lazy` + `<Suspense>`. Suspense fallback is a quiet progress bar in the same aesthetic — *no rotating tips*.
- The desk window's click handler does `navigate('/city')` and the city's entry effect handles the glide.
- `prefers-reduced-motion`: glides become 400ms crossfades.

## 7. Rendering strategy

- **Single `<Canvas>` per scene route.** Switching scenes unmounts the prior canvas — simpler than a megacanvas, cheaper for memory on mobile, and aligns with route-level code-splitting.
- The desk's window-content (the city skyline view) is a **separate, lower-res `<Canvas>`** mounted only in the desk scene. Resolution `0.4×`, FPS-capped, paused when not visible.
- **Instanced meshes** for city buildings: 1 draw call per building "type" (small / mid / spire), per-instance attributes for height, color tint, light density, pulse phase.
- **Postprocessing:** bloom on warm lamp light (desk) and on neuron lights (NN); volumetric fog in city. All postFX skipped on `prefers-reduced-motion` and below the mobile fps target (adaptive).
- **Pixel ratio capped at 2.** Opt-in "high fidelity" toggle raises to `devicePixelRatio` but warns about battery.

## 8. Content pipeline

**Lazy content loading.** The entry bundle ships only the project index — not the bodies. This keeps the initial JS within the 200KB budget regardless of how much markdown lives in `content/`.

- At build time, a small `content-index.json` is generated containing one entry per project with `id`, `title`, `category`, `district`, `thesis`, and `links`. This index is statically imported by the entry bundle.
- Per-project markdown bodies are loaded **on demand** via `import.meta.glob('/content/projects/*.md', { query: '?raw', import: 'default', eager: false })`, which returns a `Record<path, () => Promise<string>>`. The body for a project is fetched only when the user opens that project.
- `lib/content/load.ts` exposes:
  - `getProjectIndex(): ProjectIndex[]` — synchronous, available immediately.
  - `loadProjectBody(id: string): Promise<string>` — resolves to raw markdown; `marked` is dynamically imported alongside the first body request so it's not in the entry chunk.
- `/text` is the exception: it eagerly loads `about.md` (already does) **and eagerly loads every project body** because screen-readers and SEO crawlers need the full content present. The `/text` route's import graph is allowed to grow with content; the 3D routes' are not.
- Frontmatter for projects: `id, title, category, district, thesis, repo?, paper?, demo?, links[]`.

## 9. Edge function (`/api/feed`)

Single Vercel Edge handler. **The primary design is signed-URL handoff for the WebSocket; the edge function does not proxy the long-lived WS.** Vercel Edge runtime is not built for sustained WebSocket pipes, especially on the free tier — trying to use it that way is a known foot-gun that would cost us a week mid-build.

Responsibilities:

- Hold `FINNHUB_API_KEY` and `ALPHAVANTAGE_API_KEY` from env.
- **`GET /api/feed/token` — signed-URL handoff (primary path for live data):**
  - Mints a short-lived (≤60s TTL) URL the browser uses to open a **direct WSS to Finnhub**.
  - The URL embeds the Finnhub key; rotation cadence is deferred (see D6).
  - Per-IP rate-limit on the token endpoint stops casual key extraction.
  - Browser opens the WS itself, subscribes to its symbols, and reconnects on its own — the edge function is no longer in the WS hot path.
- **`GET /api/feed/rest?symbol=…` — Alpha Vantage REST proxy:**
  - Plain REST, no WS involved; 60s in-memory cache per symbol; returns `429 Retry-After` on upstream cap, which the client treats as a fallback-ladder trigger.
- **`GET /api/feed/replay` — replay metadata:**
  - Returns the latest replay dataset's manifest (date, symbol coverage); the dataset JSON itself is served as a static asset from `public/replay/`.

**Fallback variant — WS proxy from the edge:** if the signed-URL approach proves untenable (e.g., Finnhub disallows direct-from-browser clients, or key rotation can't be tightened enough), pivot to a true edge WS upgrade that pipes Finnhub → browser. Treat this as a contingency, not the default.

## 10. Build & deploy

- **Vite + TypeScript strict + React 18.**
- **pnpm** lockfile.
- **vite-plugin-glsl** for shader imports.
- **Vercel:** auto-deploy on push, preview deploys per branch, custom domain on main.
- **Bundle budget enforcement:** a CI step fails the build if the initial chunk exceeds 200KB gzipped.
- **Asset pipeline:** glTF → glTF-Transform (Draco + KTX2). Audio → ffmpeg-encoded OGG (primary) + MP3 (Safari fallback).

## 11. Testing approach

Light by design — this is a portfolio, not a SaaS app. But these are non-negotiable:

- **Type checks** (`tsc --noEmit`) in CI.
- **Lint** (ESLint + a tiny custom rule banning purple/indigo CSS values).
- **A11y smoke** via `axe-core` on `/` and `/text` in CI.
- **Lighthouse CI** on PR previews; fail if perf < 80 or a11y < 90.
- **Manual scene-walk checklist** before each release (in `engineering/release-checklist.md`).
- No unit tests for shaders/scene components. Unit tests *do* cover `lib/data/*` adapters and the orchestrator's fallback logic.

## 12. Failure modes & responses

| Failure | Detection | Response |
|---|---|---|
| WebGL unavailable | `canvas.getContext('webgl2') === null` at boot | Redirect to `/text` with banner |
| Audio context blocked | Tone.js `start()` rejection | Disable toggle visually; visuals continue |
| Market WS silent 15s | Heartbeat timer | Fallback to REST; if REST also fails, replay |
| Both feeds down | Orchestrator state | Replay mode; faint REPLAY badge |
| Frame rate < 30 in city for 5s | Stats tracker | Lower instance count, drop bloom, cap DPR=1 |
| Content load failure | Build-time error | Build fails; we don't ship a half-empty site |

## 13. Decisions deferred (resolve during build)

- **D1.** Transformer vs MLP geometry for NN (PRD Q1).
- **D2.** Custom-composed lo-fi vs licensed (PRD Q3).
- **D3.** ~~Whether the WS proxy is feasible on Vercel free tier, or we use a signed-URL client-direct pattern.~~ Resolved: signed-URL handoff is the primary design (see §9). WS-from-edge stays as a contingency.
- **D6.** Signed-URL key rotation cadence — daily vs weekly. Daily is safer; weekly is simpler. Decide once we can measure abuse signal in Phase 2.
- **D4.** Postprocessing library (`@react-three/postprocessing` vs hand-rolled) — likely the former.
- **D5.** Whether `motion` (Framer) is needed at all for DOM panels, or CSS transitions suffice.
