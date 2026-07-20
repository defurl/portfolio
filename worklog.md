<!-- worklog-sync: lastCommitSha=5a912c40defe1e2d1ac75f6517d5b080adce710a -->
# worklog.md

> One-line-per-line decision log. Append after every meaningful change.

---

## 2026-06-09 (visual upgrade — nn pbr + ssao)
- Did: Strategy C visual elevation pass on the NN corridor. (1) Merged NnBloom into a unified NnPostFx that stacks N8AO (aoRadius 1.5, intensity 2.2, medium quality) + Bloom in a single EffectComposer — AO darkens wall/floor seams and column-base contacts that the flat directional shafts can't produce. (2) Sourced Concrete033 CC0 PBR pack; committed NormalGL + Roughness maps; built ConcreteSurface component (PBR on desktop, flat fallback on mobile) with repeat-aware tile config per surface type; applied to floor, walls, ceiling, and instanced columns in NnHall. Diffuse map intentionally excluded — BG_PANEL tint from design tokens stays the palette authority. (3) Phase 5 code review fixes: monitor gradient hex literals → INK_PAPER/INK_MUTED/INK_FAINT tokens; gateway beam frozen at rest opacity under prefers-reduced-motion; projects.json district fields aligned to softwares/coursework/ml/others taxonomy; roadmap phase 5 checkboxes updated.
- Why: "boxes → real image" lift — normal-mapped concrete surface under the diagonal shaft light is the single biggest perceptual upgrade before Blender lightmap baking.
- Next: Blender lightmap bake for desk scene (Strategy B); or Lighthouse/contrast audit to close phase 5 remaining gates.

## 2026-06-04 (phase 5 execution completed)
- Did: Checkpoints 5A, 5B, and 5C completed:
  1. Authored 3 new quantitative/systems engineering projects and fully populated the plain-text /text alternate route with eager build-time imports of biography, all 6 projects, and writing pieces.
  2. Added keyboard accessibility (tab tabbing) to 3d desk scene using hidden button triggers inside Drei Html overlays, showing orange outline + mono text label on focus.
  3. Upgraded desk monitors from flat emissive colors to linear vertical gradients (GradientTexture on emissiveMap).
  4. Implemented animated WindowRain component (18 vertical drop meshes) and adjusted window transmission to 0.55.
  5. Enhanced neural gateway building with a pulsating neon orange vertical column beam.
  6. Configured localStorage audio store persistence.
  7. Ran typecheck, bundle-budget (69.4KB / 200KB), lint:colors, build, and axe-core accessibility checks (0 violations found on / and /text).
- Why: Complete production verification — ensure all content is fully populated, the plain-text version is 100% functional, full keyboard and movement navigation parity is achieved, visual aesthetics match the premium vibe, and performance/bundle ceilings are strictly respected.
- Next: Final user deployment and Phase 5.5 Soak.

## 2026-06-03 (phase 5 ui/ux polish)
- Did: Phase 5 UI/UX & Quality-of-life adjustments —
  1. Reorganized Voxel City into four custom themed districts (Capital, Market, Factory, Nexus) with curated colors, descriptions, and height/shape proportions.
  2. Implemented smooth Roblox-style dynamic zoom controls with scroll wheel, replacing discrete steps.
  3. Reset the first-person street spawn position to the exact center `[0, 1.65, 0]` looking north, framing all 4 districts symmetrically.
  4. Styled the East-West street at `z=0` as a glowing blue crossroad, animating its emissive intensity dynamically in sync with the river pulse.
  5. Solved view snapping by dynamically tracking orbit and street yaws in real-time (`orbitYaw = streetYaw + Math.PI`). Zooming out now glides seamlessly along the current line of sight.
  6. Fixed scrollable layout `tabIndex={0}` key focus a11y failure on `/text` route, resolving local `axe-core` CI checks.
  7. Automated Commit Prevention: configured `.github/workflows/metadata-sync.yml` to trigger only on cron schedule and manual workflow dispatch, stopping bot commits on push.
- Why: UX continuity — camera transitioning feels completely natural and non-disorienting; the visual aesthetics of the city are more premium with thematic districts, street lighting, and a glowing center cross. CI/CD runs are clean and do not pollute the developer's commit history.
- Next: Phase 5 content population and accessibility pass.

## 2026-06-01 (phase 4 closed)
- Did: phase 4 closed — owner approved 4d, merged to main with --no-ff. Roadmap updated to show all four checkpoints done (A scaffolding, B activations, C chambers, D transitions+audio+mobile) and phase 5 marked active.
- Why: exit gate met — full walkthrough Desk → City → NN → Project Chamber → back works end-to-end with audio scene crossfades, reduced-motion fallbacks, and mobile tap-to-walk.
- Next: phase 5 — content + a11y + perf pass. Awaiting phase-5 prompt and content from owner.

## 2026-06-01 (phase 4d)
- Did: phase 4d transitions/audio/mobile — `NnBack` overlay (bottom-left "back to desk" with 300ms fade-out + navigate). `NnRoute` mount-effect: audioStore.setScene('nn') + inbound fade-in handling mirroring DeskRoute. `useDeskToNn` (focusObject('door') glide + audio cross + 300ms fade + navigate) + an invisible `circleGeometry` hit area at the door-spill position wrapped in `InteractiveObject id='door' label='step through'`. `useCityToNn` + `neuralGatewayId()` picks the deepest-ML repo (Intel-TradingAgent fallback to most-committed ml) as the gateway building; Buildings.tsx click handler routes that one to `enterNn(id)` instead of opening the project panel. **Audio**: extended `engine.ts` with a 3-oscillator drone (A1 sine + E2 triangle + B2 sine through tone.Gain mixers into a slow-LFO-modulated lowpass + long reverb wet=0.7) connected to the existing `sceneBus.nn`; `setNnTraversal(progress)` opens filter cutoff from 380 Hz to 1280 Hz over the corridor length; `NnAudioBridge` reads camera.z each frame and forwards a quantized (>=0.02 step) progress. **Mobile**: `NnWaypoints` renders one ring per layer center on the floor (mobile only); tap sets `nnWalkTarget.z` (module-level ref); `NnCameraControls` glides camera.z toward that target at 2.2/s, cancelling on any WASD input. Reduced-motion: all glides/fades skip per existing patterns. 5 incremental commits on the branch.
- Why: phase 4 exit — visitor reaches /nn from either / (desk doorway) or /city (gateway building), and back to /. Audio respects FR-25 1.5s scene crossfade. Mobile gets a sim-sickness-safe nav model via discrete tap points.
- Next: post 4d gate.

## 2026-05-31 (phase 4c)
- Did: phase 4c chambers — `chambers.ts` config: 3 project chambers placed in the GAP_LENGTH slots between transformer layers (alternating sides — research/left, trading/right, infrastructure/left), 1 inference chamber at the back of the corridor. `NnChamber` prefab (5×5×6m room, accent back wall, walls/floor/ceiling, hidden point light). Entry-trigger via per-frame XZ distance check vs. doorway position; first crossing fires a flash on the back wall (emissive 8.0 → 1.0 over 0.8s, exp decay) + hidden PointLight intensity matches. `ChamberPanel` (drei `<Html>` with ProjectPanel-coded typography on a concrete slab — no glass-morphism). `InferenceChamber` (U24): typed prompt → 4-layer simulated forward pass over 4×600ms, SVG attention grid with weighted lines (deterministic faked attention from input+layer-index, distance-decay + per-layer global-vs-local kernel). Reduced-motion: chamber accent locks at REST intensity, no flash. Pulled real projects from content/projects.json (svi-vol-surface, execution-sim, feature-store).
- Why: chambers are the "deep dive" — projects + the live inference demo deliver the architectural-detail layer the spec calls for. Placing chambers in the layer-gap slots means no NnHall wall geometry needs cutting; the visitor walks past a literal doorway into each room.
- Next: capture + 4c gate → wait → 4d (transitions, audio, mobile).

## 2026-05-30 (phase 4b)
- Did: phase 4b activations — `nnSettingsStore` for U20 high-fi toggle (no localStorage, perf-safe default). `NeuronLights` instancedMesh: 64 spheres (8 per layer × 2 walls × 4 layers), alternating SIGNAL_AMBER/VOXEL_GLOW, MeshBasicMaterial vertexColors + toneMapped:false, per-instance phase-offset breathing pulse (BASE 0.7 → PEAK 2.4 over 4s; locked at 1.2 under reduced-motion). `TokenSplines` instancedMesh particles flowing along CatmullRomCurve3 paths (2 splines per layer, weaving past columns, 80/20 particles per spline in hi-fi/standard, pre-multiplied by 1.8× brightness factor). `NnBloom` postfx (threshold 0.6, intensity 1.1) gated by hi-fi AND not-reduced AND not-mobile AND not-low-FPS. `NnFidelityToggle` UI overlay bottom-right above audio toggle, amber on active. Hi-fi also enables `castShadow` on directional shafts. Reduced-motion: lights lock at 1.2, particles freeze in place (positions still computed from curves so they're visible, just static). Commit history within branch: 6 incremental commits per the new convention.
- Why: §4.8 spec said radius 0.15m pulse 0.3..1.5 but at corridor distances + fog density 0.025 the geometry simply doesn't read — bumped radius to 0.2m, pulse 0.7..2.4, and fixed wall-inset clipping (0.21 → 0.5m so the sphere isn't embedded in the 0.4m-thick wall mesh).
- Open: at the camera's forward-looking spawn pose the side-wall neurons are mostly peripheral; visual verification needs owner to drag-look at walls in dev. The implementation is in place and gates clean; pleasantness/visibility is a tuning conversation that needs real eyes.

## 2026-05-29 (phase 4a)
- Did: phase 4a nn scaffolding — `nnLighting.ts` canonical hall dims (6m wide × 10m high × 4×15m segments + 1.5m gaps), `NnHall` with continuous floor, per-layer wall+ceiling segments (gaps read as light slots), instancedMesh attention-head columns (4 heads × 2 walls × 4 layers = 32), `NnCameraControls` first-person locked y=1.65m with WASD + drag-look clamped to ±45° yaw / ±15° pitch, x clamped to corridor width, z clamped to hall length, no bobbing, reduced-motion snaps velocity. `NnScene` composition: FogExp2 BG_VOID 0.025, HemisphereLight 0.18, 4 directional shafts VOXEL_GLOW_SOFT @ 3.5 cast through ceiling gaps. `NnPlaceholder` css-only flickering-light suspense fallback. `scripts/prerender-nn-route.mjs` postbuild emits dist/nn/index.html with NN meta tags. Per-route Suspense in App.tsx so /nn gets its own placeholder. **Branch committed incrementally per owner feedback**: 7 commits on the branch (hall geom, scene, controls, placeholder, route, prerender, capture).
- Why: phase 1A discipline — geometry + lighting first, no neuron lights or particles yet. Bumped concrete from BG_NIGHT → BG_PANEL because pure BG_NIGHT with intensity-0.15 ambient rendered as solid black; the spec's "rich deep shadows" intent requires lit areas to be visible, which means the concrete material itself can't be at floor brightness.
- Next: capture three frames → 4a gate → wait → 4b (neuron lights + token splines).

## 2026-05-28 (phase 3 closed)
- Did: phase 3 closed — owner approved 3d, merged to main with --no-ff. Roadmap updated to show all four checkpoints done (A foundation, B buildings, C interactions, D transitions) and phase 4 marked active.
- Why: exit gate met — city renders, breathes with the market, reachable via both desk-window and /city, OG image committed.
- Next: phase 4 — inside the neural network. Awaiting phase-4-prompt.md from owner before branching.

## 2026-05-28 (phase 3d)
- Did: phase 3d transitions — `transitionStore` + `SceneFade` overlay at App root; desk window click `useDeskToCity` orchestrates audio scene crossfade → existing window focus glide (1.5s) → 300ms fade-to-black → navigate('/city'). CityRoute mounts with `CityEntry` (deep-link: black → 1.2s fade-in; from-window: rig snaps to south-entry pose (0,32,95)→(0,6,0) then glides 2s to overview while fade-in plays). DeskRoute mount handles the inbound fade-out → fade-in if returning from /city. `CityBack` extended: 'overview' mode now reads "← back to desk" and triggers a 300ms fade-out + navigate('/'). Reduced-motion path skips all glides + fades. `scripts/prerender-city-route.mjs` postbuild emits `dist/city/index.html` with city-specific og:image/title/description (3/3 swaps). `scripts/generate-og-city.mjs` (manual-run) saved `public/og-city.png` 1200×630. New `pnpm og:city` script.
- Why: phase 3 exit requires both entry paths working + an OG image. Single transitionStore keeps the timeline coherent across desk↔city and respects FR-26 reduced-motion at every step.
- Next: post checkpoint d gate → phase 3 close.

## 2026-05-27 (phase 3c)
- Did: phase 3c — `cityStore` (3-mode focus: overview/district/building + hovered), `CityCameraRig` (overview pan-and-drift at 200ms time-constant + parallax trail + orbital drift; district zoom 2.5s ease-in-out cubic; building nudge), district label click handlers (only-active-in-overview, dim to 0.3 once zoomed), building hover+click (only-active-when-its-district-is-zoomed, 200ms debounce, +20% emissive on hover, drei `<Html>` callout), `CityBuildingPanel` reuses `ScenePanel` shell + `ProjectPanel.module.css` typography, lazy README fetch via marked, stats row, github link, `CityBack` affordance bottom-left.
- Why: respect the spec's progressive disclosure — overview is the pannable atmospheric layer, district zoom is the lens, building click is the detail. Hover only at close range avoids overview-altitude finicky targeting (per §3.20 risk register).
- Next: post checkpoint c gate → wait → checkpoint d (window glide, /city deep-link, OG image).

## 2026-05-26 (phase 3b)
- Did: phase 3b — build-time fetch (`scripts/fetch-github-repos.mjs`) writes `src/generated/city-buildings.json` via paginated /users/$USER/repos + per-repo /languages + /commits last-page header for total + /readme for `district:` frontmatter, with 7-day per-repo cache and a 6h top-level cache + cache-rebuild fallback when API hits rate limit. 23 of 27 repos surface; map to 5 districts. Buildings.tsx with deterministic spiral layout (tallest at district center), per-style proportions (industrial/fortress/glass/asymmetric/brutalist/hexagonal/static/container/default), style-specific roof accents, district-tinted emissive on the base mass. PulseController + directionPulse module-level ref drives ±15% emissive modulation lerped over ~3s; per-building useFrame applies. District labels via drei Billboard + Text.
- Why: voxel grammar = same blocks + lighting, distinguished by silhouette/density/roof. Per-building Zustand subscriptions would re-render storm; module-level ref readable from useFrame keeps the React tree static.
- Next: post checkpoint b gate → wait → checkpoint c (camera + interaction).

## 2026-05-25 (phase 3a)
- Did: phase 3a city foundation — sky dome (vertex-shader gradient, three-band fog→glow→top, horizon color tracks marketStore.session over 6s, snaps under reduced-motion), river (8×120m emissive strip on x=0, sine modulation 0.5–0.7 over 6s, holds at 0.6 reduced), ground plane (200×200, BG_NIGHT base + emissive 0.02), FogExp2 BG_NIGHT 0.012, HemisphereLight BG_NIGHT/VOXEL_GLOW_SOFT @ 0.35, DirectionalLight VOXEL_GLOW_SOFT @ 0.4 no-shadow, AmbientLight BG_VOID @ 0.05, CityBloom postfx (threshold 0.4, catches the river only), CityCameraDev (DEV-only `window.__city.setCamera` hook for verification captures since the spec overview camera doesn't show sky over an empty ground). DeskData reused as the market-data bridge in CityRoute. CityRoute lazy chunk: 3.9 KB.
- Why: phase 1A discipline — lighting and atmosphere before geometry. The sky shader needs explicit linear→sRGB encoding because ShaderMaterial outputs raw linear and the canvas treats it as sRGB (otherwise BG_VOID renders as pure black).
- Next: capture three sessions → checkpoint a gate; wait for owner review before checkpoint b (GitHub fetch + buildings).

## 2026-05-25 (later)
- Did: phase 2 closed — checkpoint c approved (owner ear-test passed: "sound is alright"), 2c merged to main with --no-ff, roadmap updated to show all three checkpoints done + q6 resolution recorded
- Why: exit gate met — data spine + sonification both run from replay tape, pull-the-network test passes, audio is opt-in and pleasant enough to leave on
- Next: phase 3 — voxel city. Phase 3 risk (window rim-light re-tune) already documented in roadmap §3

## 2026-05-25
- Did: phase 2c sonification — engine rewrite with pad (mode by direction, lydian/aeolian/phrygian cycles, lfo'd lowpass + reverb), bass (sine sub, beat-driven, BPM ramped from VIX 60→92), tick percussion (noise burst through bandpass, panned by ticker charcode, dynamic p95-of-60s volume threshold), tape-coded chebyshev saturation on master, per-scene gain buses with 1.5s crossfade, prefers-reduced-motion lengthens pad glide + mutes ticks + holds 60 BPM. marketStore.subscribeTickEvent side-channel. DeskAudio wires engine to audioStore/sceneStore/marketStore. Smoke test: 0 errors over enable + direction-change + vix-spike sequence.
- Why: phase 2 exit gate — the desk audio must be the market, not a fixed loop. Engine surface is imperative (setEnabled/setScene/setIndex/pushTick/setReducedMotion) so scene switching in phase 3 is one call from City/NN routes.
- Next: post checkpoint c gate evidence; owner runs the 30s/1m pleasantness test by ear.

## 2026-05-24 (later)
- Did: phase 2b — marketStore (zustand, Map of ticks + index + session + status), createMarketOrchestrator (replay-only impl with TODO(phase-5) for live/rest), DeskData bridge, /lib/data/clock.ts session derivation (NY tz via Intl), FeedStatusBadge bottom-left with tooltip, Window indicator lerps city emissive (direction) + sky emissive (session) in useFrame from store.getState(), dev hooks `__phase2b_setSession/setDirection/focus` (DEV-only, dead-code-eliminated in prod), design-spec corner_allocation updated, capture-phase2b.mjs script
- Why: option a payoff is the data-driven window — wire the spine to the visible scene, with the orchestrator's shape already future-proof for B/C live adapters
- Next: gate evidence post for checkpoint b → wait → checkpoint c (sonification)

## 2026-05-24
- Did: phase 2a scaffolded — types extended (loopStartTs, IndexDirection, MarketSession, SymbolMap, ReplayDataset), replay adapter, synthetic generator, capture script (prepared, not run), /debug/replay route, 392KB committed tape
- Why: option a accepted — replay-first data spine, no network calls in live path, adapter shape ready for live swap in phase 5
- Next: post checkpoint a evidence, wait for owner review before checkpoint b (orchestrator + marketStore + window indicator)

---

# 📍 Current state — Phase 1 Checkpoint A (for PM review)

**Branch:** `phase-1A/checkpoint-a-revision` · **Head:** `fee1bc7` · **Pushed to origin** · **Awaiting merge to main**

**Status:** Owner approved the foundation. Right-wall lighting is the one acknowledged open item, deferred to Checkpoint B / polish.

## What was delivered

A populated, lit, atmospheric Night Desk scene matching the revision-prompt's lighting plan and the reference image's mood. Eleven hand-built objects on a real elevated desk, lamp-anchored composition, window on the right side wall with city-beyond glow visible through transmissive glass.

## Final scene state

### Camera
- Position `(0, 1.15, 2.2)`, lookAt `(0, 0.4, 0)`, FOV 50°

### Lighting (mirrors `lighting-plan.svg` exactly)
| Light | Color | Token | Intensity | Distance | Decay | Notes |
|---|---|---|---|---|---|---|
| Ambient | `#0A0F1A` | `BG_NIGHT` | 0.15 | — | — | — |
| KEY (lamp) | `#FFB661` | `LAMP_WARM` | 8.0 | **2.8** | 2 | castShadow, mapSize 1024², bias -0.0005. Distance bumped from spec 2.0 → 2.8 so the keyboard sits in the falloff. |
| FILL ×2 (monitors) | `#5BC8FF` | `VOXEL_GLOW` | 3.2 each | 1.5 | 2 | **`SpotLight`** aimed at keyboard targets `[-0.3, 0.04, 0.2]` and `[0.5, 0.04, 0.2]`, angle 0.6 rad, penumbra 0.7 — was `PointLight` which puddled on the desk. |
| RIM (window) | `#2A6B8A` | `VOXEL_GLOW_SOFT` | 1.2 | — | — | DirectionalLight from `(1.4, 1.0, -0.6)` toward `(0, 0.5, 0)` |
| DOOR SPILL | `#FFB661` | `LAMP_WARM` | 2.4 | 2.5 | 2 | Position `[-1.8, 0.4, 1.0]` per spec |
| Bloom | — | — | int 0.9, threshold 0.1 | — | — | Single broad pass, catches lamp bulb + both monitor emissives |

### Geometry — room
- **Floor:** 10m × 10m at `y=-0.74`, BG_PANEL, receiveShadow
- **Back wall:** solid 6m × 2.5m at `z=-1.2`, no cutout
- **Right side wall:** at `x=+2.0` facing -X, built as four segments around the window opening (behind / in-front-of / above / below the window)
- **Desk:** 2.0m × 0.9m × 4cm top on four cylindrical legs (radius 2.5cm, height 70cm, INK_GHOST metal), centered z=-0.15

### Geometry — objects (all foot-on-desk, group origin = base of object)
| Object | Position | Notes |
|---|---|---|
| Lamp | `[-0.95, 0, -0.2]` | Open-hemisphere shade, bulb at world `(-0.95, 0.35, -0.2)` matches PointLight |
| Monitor 1 (primary, amber) | `[-0.3, 0.306, -0.4]` | Emissive `SIGNAL_AMBER_DIM` × 1.2, toneMapped:false |
| Monitor 2 (terminal, cool) | `[0.5, 0.27, -0.4]` | Emissive `VOXEL_GLOW_SOFT` × 1.0 |
| Keyboard | `[0, 0.011, 0.2]` | TKL with ~60 caps + spacebar slot |
| Mug | `[-0.55, 0, 0.15]` | Pulled in from spec z=0.35 (past desk edge) |
| Notebook | `[-0.4, 0, 0.05]` | Moved from spec `[-0.05, 0.025, 0.4]` (hung off desk front) |
| Plant | `[-0.8, 0, 0.1]` | DATA_GREEN × 0.35 runtime scalar, jittered leaf rotations |
| Headphones | `[0.85, 0.045, 0.15]` | Cup radius offset after π/2-X rotation |
| Phone | `[1.0, 0, -0.05]` | Face-down, camera bump on back |
| Window | `[1.98, 1.0, -0.3]` + rotation `[0, -π/2, 0]` | On right wall, glass `MeshPhysicalMaterial` (transmission 0.3, ior 1.45, BG_NIGHT color), city-beyond plane behind the wall at world x≈2.28 with stacked emissives (upper 1.4 / lower 0.55) |

### AudioToggle
- Restyled to a faint `· sound off` Departure Mono caption, bottom-right, no border, 0.7 opacity baseline / 1.0 on hover. Disappears into the scene unless looked for.

## Failure tags — all nine closed

| Tag | Resolution |
|---|---|
| `lamp-shape` | Open hemisphere shade per spec, weighted base, bulb dangling at rim |
| `plant-collision` | Verified xz distance 0.335m vs combined radii 0.095m — no overlap |
| `void-edge` | 10×10 floor + 6m back wall + right side wall extending from back-wall corner past camera |
| `emissive-flat` | Proper `MeshStandardMaterial` with BG_VOID base + emissive tint at spec intensities |
| `window-flat` | `MeshPhysicalMaterial` with transmission, color BG_NIGHT (NOT cyan) — cool cast comes from rim light through the glass |
| `no-door-spill` | Visible at spec position `[-1.8, 0.4, 1.0]` once camera pulled back to z=2.2 |
| `no-contact-shadow` | Single shadow-caster (lamp), every desk object has castShadow on primary mesh, desk/floor/wall receiveShadow |
| `default-chrome` | Atmospheric Departure Mono caption per snippet |
| `mood-missing` | Warm-cool tension, lamp pool focal, dark quiet room — verified by owner |

## Gates

- `pnpm typecheck` ✅
- `pnpm lint` ✅ (--max-warnings=0)
- `pnpm lint:colors` ✅ (35 files clean)
- `pnpm build` ✅
- `pnpm bundle:check` ✅ — **63.0KB / 200KB budget** (entry chunk unchanged from Phase 0; three / r3f / postprocessing / drei all in the lazy `DeskRoute` chunk)

## Iteration arc (compressed)

1. Lighting-only gate v1 — coplanar desk + floor, lamp readable but unrooted
2. Lighting-only gate v2 — real desk with legs, owner approved → proceeded to objects
3. Order-of-operations §3-§7 — monitors, window, remaining objects, AudioToggle restyle
4. PM review #1 — 5 issues: monitor-fill puddling, marginal door spill, keyboard outside lamp reach, notebook floating off desk, AudioToggle (already fixed, predated screenshot)
5. PM review #2 (owner) — all objects floating by half-height (`position.y` confusion); seated every object on the desk
6. Owner review — mug off desk, window detached from wall → mug position fix, back-wall cutout around window
7. Owner review — window relocated to right side wall (FPP intent), back wall restored to solid
8. **Owner approved (current state)**

## Open items for next phase / polish

1. **Right-wall fill lighting** — wall at x=+2.0 reads dark from camera POV because no light source reaches it. Owner accepted this as consistent with the reference image but flagged for later. Easiest fix: a tiny warm fill PointLight or extending lamp distance.
2. **Departure Mono `.woff2`** — still pending from Phase 0; falls back to JetBrains Mono until dropped into `public/fonts/`.
3. **Vercel project + custom domain** — still pending from Phase 0.
4. **Monitor screens are flat fills** — `lighting-plan.svg` mentioned a subtle vertical gradient as polish, deferred.
5. **Headphones silhouette ambiguity** in still frames — slight band angle adjustment would help; not urgent.
6. **Lamp arm rotation math** uses two independent rotations (`tiltX`, `tiltZ`) — works for the current vertical arm but would get the rotation order wrong if the arm were angled sideways. Not urgent.

## Next decision for owner

Pick one:
- **(a) Merge `phase-1A/checkpoint-a-revision` → `main` and start Checkpoint B** on a new branch `phase-1B/desk-interactions` (hover states, click→camera glide, panel slide-ins, audio loop).
- **(b) Tune Checkpoint A further** before merging (right-wall lighting, anything else).

Detailed iteration history is below for reference.

---

## 2026-05-24 — PHASE 1 CLOSED ✅
- **Checkpoint A**: done 2026-05-18 (squash-merged commit `e9f873e`)
- **Checkpoint B**: done 2026-05-22 (no-ff merge `79e3a5e`, 8 commits preserved)
- **Checkpoint C**: done 2026-05-24 (no-ff merge, all commits preserved)
- **New deps added**: `@react-three/postprocessing` (Checkpoint A 1.3)
- **Deviations from spec, all documented**:
  - SRS NFR-4 — Lighthouse perf target 85 → 70 on the landing route. Three.js parse on Lighthouse's 4× CPU throttle dominates LCP intrinsically. Network-side mitigations in place (lazy chunk, `modulepreload` for DeskRoute). `/text` fallback scores ≥90 — every visitor has a fast path.
  - Window relocated to the right side wall (owner direction) instead of being mounted on the back wall as the original kickoff implied.
  - Object positions tuned past the kickoff's literal coordinates: mug/notebook/phone moved so each sits fully on the desk; phone flip arc-lifts so its edge doesn't clip the desk surface; mug handle rotated so its cut ends attach to the body.
- **Open TODOs for Phase 2/3/5**: right-wall fill lighting (P5 polish), monitor screen vertical gradient (P5 polish), rain shader on window glass (P5 polish), Departure Mono `.woff2` drop (owner action), localStorage audio-preference nuance (deferred — current behaviour is off-by-default per design-spec), baked-poster LCP cover (Option B from the Lighthouse triage — would raise perf to ≥85 if revisited). **Phase 3 risk noted in roadmap**: window rim-light interplay shifts when the real voxel city replaces the placeholder city-beyond planes.
- **Outstanding owner actions**: Departure Mono `.woff2` into `public/fonts/`, Vercel project + custom domain (still pending from Phase 0), final OG image rendering, on-device 45fps verification (NFR-1, can't auto-test).

## 2026-05-23 — phase 1C: mobile reduced-fidelity variant
- Did: Merged `phase-1B/desk-interactions` → `main` with `--no-ff` (per the CONTRIBUTING.md update — phase boundaries preserved in history). Branched `phase-1C/mobile` off the new main. Roadmap: Checkpoint B ✅, Checkpoint C active.
  - **Mobile detection (1.21)**: `useMediaQuery` + `useIsMobile` hook (`max-width: 768px`). Wired in `App.tsx` as the sole subscription site, pushed into `sceneStore.isMobile` so every component reads from one source. `<div className="grain" data-mobile={...}>` for CSS targeting too.
  - **Mobile camera variant (1.21)**: `DeskRoute` swaps to position `(0, 1.6, 2.4)`, lookAt `(0, -0.05, -0.1)`, FOV 38 (down from 50). Wider, more orthographic-coded framing that fits all eleven objects without scroll. `cameraPoses.ts` exports `REST_POSE_MOBILE`; `CameraRig` picks the correct rest pose by reading `isMobile` at each focus-change.
  - **Bloom + scroll disabled on mobile (1.21)**: `BloomLayer` short-circuits when `isMobile`. `TerminalPanel`'s rolling-tail animation disabled on mobile.
  - **Simplified keyboard (1.21)**: `Keyboard` collapses from 14×5 to 8×3 caps on mobile — same silhouette, far fewer draw calls.
  - **Mobile interaction model (1.22)**: `InteractiveObject` adds a tap-to-arm / second-tap-to-activate flow when `isMobile`. First tap shows the label and sets a 3s arm window; second tap on the same object within the window calls `onActivate`. Pointer-over/out paths are skipped on mobile (touch has no hover).
  - **Mobile panel (1.22)**: `ScenePanel` switches from a 480px right-side slide-in to a full-screen bottom-up slide on mobile. Swipe-down-to-close added via pointer-event y-delta (>80px). Esc + × still work.
  - **Mobile audio toggle (1.23)**: `AudioToggle` migrates to a thin top-right bar at the mobile breakpoint, so it doesn't compete with the bottom of the full-screen panel UI. Touch target `min-height: 44px` per 1.24.
  - **Mobile typography (1.24)**: every type-scale rung steps down one level (`step-3 → step-2`, etc.) inside `@media (max-width: 768px)` on `:root`, so existing components keep referencing the same `var(--step-N)` names. Body line-height tightened 1.6 → 1.5.
  - **Visual evidence (new)**: `scripts/capture-states.mjs` — a Playwright headless-chromium script that drives a 375×812 mobile viewport against the running dev server, captures four PNGs (rest, tap-to-label, panel-open, audio-toggle), saves to `captures/checkpoint-c/`. Wired as `pnpm capture:states`. Captures gitignored. Closes the PM-noted "visual evidence" gap from Phase 1B — Checkpoint C and beyond can self-produce review screenshots.
- Gates: typecheck ✅, lint ✅, lint:colors ✅ (55 files), build ✅, bundle ✅ **63.2KB / 200KB** (tiny growth from `useMediaQuery`).
- **Lighthouse not run locally** — Windows + no system Chrome (Playwright's chromium is at a different path Lighthouse can't drive). It'll run in CI on push. Owner can verify locally on a machine with Chrome installed.
- **Visual evidence captured**: `captures/checkpoint-c/{01-rest, 02-tap-label, 03-panel-open, 04-audio-toggle}.png`. Verified `01-rest.png` shows the mobile variant (raised+tilted camera, full-desk overview, simplified keyboard, top-right audio toggle).
- Why: Completes Checkpoint C — mobile reduced-fidelity variant at the 375px viewport per 1.21–1.24.
- Next: WAIT at the Checkpoint C review gate (1.26). Owner reviews the four captured PNGs + runs Lighthouse on their machine; once approved, Phase 1 closes.

## 2026-05-18 — phase 1B remaining panels: terminal, notebook, phone, audio
- Did: Owner approved the first slice (hover + ProjectPanel); continued Checkpoint B with the rest of 1.15–1.18.
  - **Label-lingering fix**: `InteractiveObject` now suppresses the hover label whenever `focus !== null`, so a label doesn't float over an open panel when the pointer is still physically over a mesh.
  - **TerminalPanel (1.15)**: `scripts/fetch-github-activity.mjs` hits the GitHub public-events API for `defurl` at build time, filters PushEvent/PullRequestEvent in the last 7 days, writes `src/generated/github-activity.json` (gitignored). Reads `GITHUB_TOKEN` from env if present; excludes repos in `scripts/github-activity-exclude.json` (empty `[]`); writes a graceful stub on any failure. Wired as `predev`/`prebuild` + a CI step before typecheck. `lib/content/activity.ts` gives the blob a stable type. `TerminalPanel` shows `// defurl — last 7 days`, the commit list (or a graceful empty/stub line — the repo is private so public events are currently empty), a slow rolling-scroll on the list when motion is allowed, and an ~80-word bio derived from `about.md`.
  - **NotebookPanel (1.16)**: `content/writing.json` index + two real-reading placeholder pieces (`on-lookahead`, `sonifying-the-tape` — actual short essays, no Lorem Ipsum). `load.ts` extended with `getWritingIndex` / `loadWritingBody` (same lazy non-eager glob pattern). `NotebookPanel` reuses `ProjectPanel.module.css` — same list/body shape.
  - **Phone (1.17)**: rebuilt `Phone` with an inner flip group pivoting about the phone's centre-line; `focus === 'phone'` drives a 700ms Z-rotation flip (instant under reduced motion). A screen mesh on the face + a drei `<Html>` mailto link (`amorelyn.work@gmail.com`, Departure Mono amber) that mounts only once the flip is >85% complete so it doesn't show through the back mid-rotation.
  - **Audio (1.18)**: `src/audio/engine.ts` — Tone.js is **dynamically imported on first enable** (audio is opt-in, so its ~heavy library stays out of the bundle until opted into). A simple four-chord minor-key pad loop at 0.3 master gain through a lowpass + reverb, 68 BPM. `Tone.start()` is the user-gesture unlock, satisfied because the toggle click is in the call stack. `DeskAudio` bridges `audioStore.enabled` → `setDeskAudio`. The headphones object's click toggles audio (no camera glide, no panel).
  - **Interaction wiring**: Monitor 2 → terminal panel, Notebook → notebook panel, Phone → contact (flip), Headphones → audio toggle, Window → camera glide toward the window (no panel — the `/city` transition lands with Layer 2).
- Gates: typecheck ✅, lint ✅, lint:colors ✅ (54 files), build ✅, bundle ✅ 63.0KB (Tone.js stays in its own dynamic chunk, never the entry).
- Deferred: door-spill hover (no marker geometry), subtle hover feedback for non-nav objects, localStorage audio-preference persistence (B4 nuance — current behaviour is the dominant rule: OFF by default, no autoplay, opt-in), `--dur-camera` subjective tuning.
- **Visual verification owed**: per the PM retrospective, Checkpoint B acceptance needs rendered-behavior evidence. Claude Preview MCP still disconnected — owner screenshots requested for the WAIT review.
- Why: Completes Checkpoint B's interaction surface (1.11–1.18).
- Next: WAIT at the Checkpoint B review gate (1.20). Owner verifies all object interactions + panels, then Checkpoint C (mobile).

## 2026-05-18 — phase 1B first deliverable: hover states + ProjectPanel
- Did: New branch `phase-1B/desk-interactions` off main. Built the first Checkpoint B slice — the hover/click/panel grammar, proven end-to-end on Monitor 1.
  - **`interactionStore`** (new Zustand store): `hovered` (object under pointer), `focus` (object the camera glided to), `panel` (open DOM panel). Actions: `setHovered`, `focusObject(id, panel)`, `returnToDesk`.
  - **`InteractiveObject`** wrapper (1.11): pointer over/out writes `hovered` to the store, sets the document cursor (pointer only when clickable), shows a Departure Mono one-word label via drei `<Html>` (transform=false, prepend, pointerEvents=none). Wraps Monitor 1/2, Window, Notebook, Headphones, Phone. Hover-scale lift was tried and dropped — scaling a wrapping group moved object feet off the desk; the label + cursor + monitor emissive lift carry the affordance instead.
  - **Monitor emissive lift** (1.11): Monitor reads `hovered === hoverId` from the store and lifts screen emissive ×1.2 on hover. Instant swap (no easing frame loop) — still appears under reduced motion.
  - **`CameraRig`** (1.12): hand-rolled time-parameterized glide, 2200ms, easeInOutCubic (solver-free stand-in for the design-spec camera-bezier). On `focus` change it lerps camera position + a tracked lookAt point from current pose to the target pose in `cameraPoses.ts`. Reduced motion → instant snap. REST pose = Checkpoint-A framing.
  - **`ScenePanel`** (1.13): generic right-side slide-in, 480px, `backdrop-filter: blur(20px)` over `--bg-panel`@0.85, 1px `--ink-ghost` left border, slide via transform over `--dur-reveal`. Esc closes; × button closes. CSS comment flags the documented glass-morphism exception.
  - **`ProjectPanel`** (1.14): driven by `content/projects.json` index; click a project → `loadProjectBody(id)` (lazy `import.meta.glob`, non-eager) renders the markdown body in place; "← back to list" returns. `content/projects.json` + three real-reading placeholder projects authored (`svi-vol-surface`, `execution-sim`, `feature-store` with markdown bodies — no Lorem Ipsum).
  - **`lib/content/load.ts`** (B3 strategy): `getProjectIndex()` sync, `loadProjectBody(id)` async via non-eager glob.
  - **`BackToDesk`** (1.12): bottom-left Departure Mono affordance, visible only when `focus !== null`, reverses the glide.
- Wired: Monitor 1 fully (hover → label "projects" + emissive lift; click → camera glide → ProjectPanel slide-in; close/back → glide home). Monitor 2 / Window / Notebook / Headphones / Phone get hover + label only — their click panels (terminal/notebook/contact) are the next slice.
- Gates: typecheck ✅, lint ✅, lint:colors ✅ (47 files), build ✅, bundle ✅ 63.0KB. Dev server boots clean — HTTP 200, modules transform correctly.
- **Visual verification owed**: per the PM's Checkpoint B retrospective, acceptance needs rendered-behavior screenshots (hover before/after, panel mid-slide, camera glide start/mid/end). The Claude Preview MCP is disconnected this session — I can't capture them. Owner screenshots requested in chat.
- Deferred to next slice: TerminalPanel (1.15) + GitHub activity fetch, NotebookPanel (1.16), Phone flip (1.17), audio loop (1.18), door-spill hover (no marker geometry yet), subtle hover feedback for non-nav objects (lamp/mug/plant/keyboard), eased emissive lift.
- Why: First Checkpoint B deliverable — the two interactions (hover + ProjectPanel) that prove the diegetic-navigation grammar works.
- Next: WAIT for owner review of the hover + ProjectPanel behavior. Then wire the remaining panels.

## 2026-05-18 — phase 1A CLOSED, squash-merged to main
- Did: Squash-merged `phase-1A/checkpoint-a-revision` → `main` as a single commit `feat(desk): phase 1A — night desk scene with lighting and shadows`. Branch deleted (local + remote). `docs/04-roadmap.md` updated: Phase 1 split into Checkpoint A (checked off ✅) / B (active) / C; added a Phase 3 risk note about the window rim-light interplay shifting when the real voxel city replaces the placeholder city-beyond planes.
- What landed in Checkpoint A: full Night Desk scene — real desk on legs, banker's-lamp key light with hemisphere shade, two emissive monitors, eight more hand-built objects all foot-on-desk with contact shadows, window cut into the right side wall with city-beyond glow, door spill on the floor camera-left, atmospheric AudioToggle. All nine revision-prompt failure tags closed. Gates green: typecheck / lint / lint:colors / build / bundle (63KB).
- Deferred to Checkpoint B: object interactivity (hover, click→camera glide, panels), AudioToggle wired to a lo-fi loop. Deferred to Checkpoint B tail / C: rain shader on the window glass.
- Deferred to polish: right-wall fill lighting (wall at x=+2.0 reads dark — owner accepted as reference-consistent), monitor screen vertical gradients (currently flat emissive fills).
- Why: Checkpoint A approved by owner ("the night desk is real now"). Squash chosen per CONTRIBUTING.md — the branch had many small lighting-tuning commits not worth individual history on main.
- Next: Checkpoint B on `phase-1B/desk-interactions` off the new main. First deliverable target: hover states + ProjectPanel slide-in (the two that prove the diegetic-navigation grammar).

## 2026-05-18 — phase 1A checkpoint A approved (foundation)
- Did: Resolved owner's last two feedback rounds in sequence:
  1. **Window as a real opening, not a panel hung on the wall**: rebuilt the back wall as four segments around the window cutout, with the city-beyond plane behind the wall plane. Glass `MeshPhysicalMaterial` (transmission 0.3, BG_NIGHT base) lets the city read through.
  2. **Wall not filling the camera frame** (right side dropped into void): widened back wall from 3m to 6m so the frame doesn't open into nothing past x=±1.5.
  3. **Window relocation to right side per FPP intent**: restored back wall to a solid 6m × 2.5m panel; added a new right side wall at x=+2.0 facing -X, built as four segments around the window opening. Window component now accepts `rotation` prop (default `[0,0,0]`) — DeskScene passes `rotation={[0, -π/2, 0]}` and position `(1.98, 1.0, -0.3)` so the frame faces back into the room and the city plane lands at world x≈2.28 (behind the wall plane). City-beyond split into two stacked emissive planes (upper bright at intensity 1.4, lower at 0.55) for a sense of skyline depth.
  4. **City emissive bumped** from 0.18 → 1.4/0.55 so the window reads as a glowing aperture, not a faint dark rectangle.
- Owner verdict: foundation approved. Right wall is dark (no fill lighting reaches x=+2.0 yet); this is consistent with the reference image where the right side is dark except for the window. Owner noted this for a later phase rather than a Checkpoint A blocker.
- Gates after all fixes: typecheck ✅, lint ✅, lint:colors ✅. Entry bundle unchanged at 63.0KB.
- Camera state (final): `(0, 1.15, 2.2)` looking at `(0, 0.4, 0)`, FOV 50°.
- Object roster (final positions, all foot-on-desk):
  - Lamp `[-0.95, 0, -0.2]`, bulb at world `(-0.95, 0.35, -0.2)`
  - Monitor 1 (primary, amber) `[-0.3, 0.306, -0.4]`
  - Monitor 2 (terminal, cool) `[0.5, 0.27, -0.4]`
  - Keyboard `[0, 0.011, 0.2]`
  - Mug `[-0.55, 0, 0.15]` (pulled in from z=0.35 to stay on desk)
  - Notebook `[-0.4, 0, 0.05]`
  - Plant `[-0.8, 0, 0.1]`
  - Headphones `[0.85, 0.045, 0.15]`
  - Phone `[1.0, 0, -0.05]`
  - Window on right wall: position `[1.98, 1.0, -0.3]`, rotation `[0, -π/2, 0]`
- All nine failure tags closed: lamp-shape, plant-collision, void-edge, emissive-flat, window-flat, no-door-spill, no-contact-shadow, default-chrome, mood-missing.
- Next: Owner to either (a) merge `phase-1A/checkpoint-a-revision` → `main` and start Checkpoint B (interactions + panels) on a new branch, or (b) call out further tuning. Right-wall lighting and bloom tuning are explicit open items, deferable to Checkpoint B or polish.

## 2026-05-18 — phase 1A fix floating objects + shadow projection
- Did: Owner's fresh screenshot revealed every object on the desk was floating by half its own height. Root cause: the DeskScene positions were written as if `position.y` meant "object base sits at this y," but each component's geometry centers itself on the group origin (so e.g. a mug at `y=0.06` puts its center at 0.06m, base 0.0425m below center, base actually at y=0.018 — 1.8cm above desk). Shadows then projected from where the LIGHT saw the floating mesh, landing on the desk a hand's-width away from where the eye expected the contact — that's what reads as "shadows off."
- Concrete offsets corrected, all units meters:
  - Monitor 1 (0.36m bezel): y `0.55 → 0.306` (foot at local -0.306 from group, now at desk surface)
  - Monitor 2 (0.30m bezel): y `0.55 → 0.27`
  - Keyboard: y `0.04 → 0.011` (lower body extends 0.011 below group origin)
  - Mug, Phone, Plant, Notebook: y `→ 0` (their components already place geometry above the group origin, so group origin = base)
  - Headphones: y `0.04 → 0.045` (cup radius extends below group origin in world Y after the π/2-X rotation)
  - Lamp was already correct
- Why: All objects now sit ON the desk top; contact shadows from the lamp PointLight will land directly under each object instead of offset by a half-height gap.
- Gates: typecheck ✅, lint ✅, lint:colors ✅. No bundle change.
- Next: Owner verifies the new render. Open whether monitors at the corrected height (foot on desk, bezel center now at y=0.306 vs prior 0.55) look right proportionally for the scene, or want adjustment.

## 2026-05-18 — phase 1A review feedback applied
- Did: Product manager reviewed the prior checkpoint A render. Four real issues + one stale-perception item:
  - **Criterion 1 (lamp pool brightest)** failed because the two monitor FILL PointLights were creating saturated circular cyan pools on the desk surface that competed with the lamp pool for visual primacy. Fix: switched both fills to `SpotLight` aimed at the keyboard zone (target positions `[-0.3, 0.04, 0.2]` and `[0.5, 0.04, 0.2]`), with cone angle 0.6 rad (~34°) and penumbra 0.7 for soft edges. The cyan now lands on the keyboard / fronts of objects rather than puddling on the desk behind them. Source: `lighting.ts` adds `MONITOR_FILL_TARGETS`, `MONITOR_FILL_ANGLE`, `MONITOR_FILL_PENUMBRA`; `DeskScene.tsx` mounts `<spotLight>` instead of `<pointLight>` for the two fills.
  - **Criterion 3 (door spill visible)** was marginal because the spill at spec position `[-1.8, 0.4, 1.0]` was visually merging with the lamp's own floor pool. Fix per PM Option B: moved to `[-1.8, 0.4, 0.5]` (forward of the lamp's floor reach, distinct second source) and bumped intensity 2.4 → 3.5 to compensate for the steeper angle.
  - **Criterion 4 (keyboard in lamp falloff)** failed because `LAMP_DISTANCE: 2.0` was too steep — the keyboard sat outside the pool entirely. Fix: bumped `LAMP_DISTANCE` to 2.8. Keyboard now well within the falloff.
  - **Notebook floating off desk front**: notebook at `[-0.05, 0.025, 0.4]` had its center 0.1m past the desk's z=0.3 front edge, so half the 0.245m-deep cover hung in mid-air. Fix: moved to `[-0.4, 0.025, 0.05]` — camera-left of the keyboard, behind the mug, fully on the desk with no overlap with adjacent objects.
  - **AudioToggle "still chrome"**: verified in source — restyle landed in commit `6bd21d4` (transparent bg, no border, Departure Mono caption, 0.7 opacity baseline). PM's screenshot view predated that commit. No source change needed; flagging for visual re-verification.
- Camera state (PM clarification request): `(0, 1.15, 2.2)` looking at `(0, 0.4, 0)`, FOV 50°. No further moves since the lighting-gate-v2 entry. The screenshots shown in chat are from this exact camera.
- Object roster currently placed in `DeskScene`: floor, back wall, desk surface (2.0m × 0.9m on four legs), lamp, monitor 1 (primary, amber emissive 1.2), monitor 2 (terminal, cool emissive 1.0), window, keyboard, mug, notebook (new position), plant, headphones, phone. Eleven elements + door-spill light.
- Failure tags now closed: `lamp-shape`, `plant-collision`, `void-edge`, `emissive-flat`, `window-flat`, `no-door-spill` (PM-verified pending), `no-contact-shadow`, `default-chrome`, `mood-missing`. Criteria 1–5: 1 ⏳ pending PM re-screenshot; 2 ✅; 3 ⏳ pending PM re-screenshot; 4 ⏳ pending PM re-screenshot; 5 ✅.
- Gates: typecheck ✅, lint ✅, lint:colors ✅, build ✅, bundle:check ✅ (63.0KB / 200KB unchanged).
- Why: Direct response to product manager's review. All listed issues addressed by source change; one item (default-chrome) needs no change but needs visual re-verification.
- Next: Owner needs to capture a screenshot at the new state (Claude Preview MCP is currently disconnected so I can't capture from this session). Once provided, PM can verify criteria 1, 3, 4 and the AudioToggle close.

## 2026-05-18 — phase 1A checkpoint A complete (revision)
- Did: Owner approved the lighting gate. Walked the order-of-operations §3–§7. **Step 3 (monitors, `emissive-flat` fix)**: rewrote `Monitor.tsx` with proper emissive screens — `MeshStandardMaterial`, dark BG_VOID base, emissive SIGNAL_AMBER_DIM at intensity 1.2 (primary) / VOXEL_GLOW_SOFT at intensity 1.0 (terminal), `toneMapped: false` for bloom catchability; bezel + stand both `castShadow`. **Bloom retuned**: collapsed two-pass bloom to a single broad pass at threshold 0.1 so it actually catches monitor emissives (their luminance ~0.12-0.13 was well below the prior 0.3-0.6 thresholds). **Step 4 (window, `window-flat` fix)**: rebuilt `Window.tsx` with frame as four BG_PANEL boxes around the perimeter, glass as `MeshPhysicalMaterial { color: BG_NIGHT, transmission: 0.3, ior: 1.45, roughness: 0.05, thickness: 0.05 }` — color is BG_NIGHT, NOT cyan; the cool cast comes from the rim DirectionalLight passing through. Placeholder "city beyond" plane 30cm behind the glass with BG_VOID base + VOXEL_GLOW_SOFT bleed (replaced by real voxel city in Phase 3). **Step 5 (door-spill re-verify)**: still passing after object placement; the warm patch on the floor camera-left is unchanged. **Step 6 (rest of objects)**: wired Keyboard / Mug / Plant / Notebook / Headphones / Phone into the scene at the lighting-plan table positions. All primary meshes have `castShadow` (no-contact-shadow fix). Plant: leaves now use `new Color(DATA_GREEN).multiplyScalar(0.35)` runtime so they read as a muted houseplant under warm lamp light, not a UI signal; per-leaf rotation jittered seedwise so the silhouette isn't a clock face. Plant-collision: confirmed plant at (-0.8, 0.1) vs lamp base at (-0.95, -0.2) — xz distance 0.335m, combined radii ~0.095m, no overlap. **Step 7 (`default-chrome` fix)**: restyled `AudioToggle` per the revision-prompt snippet — Departure Mono caption, no border, 0.7 opacity baseline / 1.0 on hover, tiny status dot. The toggle now disappears into the scene unless you look for it.
- Gates: typecheck ✅, lint ✅, lint:colors ✅ (35 files clean), build ✅, bundle:check ✅ (63.0KB / 200KB — entry chunk unchanged from Phase 0).
- All nine failure tags addressed: `lamp-shape` ✅ open hemisphere shade; `plant-collision` ✅ verified no overlap; `void-edge` ✅ 10×10 floor + back wall; `emissive-flat` ✅ proper emissive screens at 1.0-1.2 intensity; `window-flat` ✅ physical glass with transmission; `no-door-spill` ✅ spec position visible with camera pulled back; `no-contact-shadow` ✅ castShadow on every desk object; `default-chrome` ✅ atmospheric toggle; `mood-missing` ✅ warm-cool tension, lamp pool focal, dark quiet room.
- Why: Phase 1 Checkpoint A redo per the revision prompt, after the first attempt was rejected for flat lighting and the second attempt was rejected for the dev server not running. Branch pushed to origin earlier; subsequent commits ride on top.
- Next: WAIT at the Checkpoint A acceptance gate (revision-prompt step 8 / kickoff-prompt 1.10). Owner reviews the screenshots + the side-by-side comparison against the reference image. If approved, branch can merge to main and Checkpoint B begins on a new branch.

## 2026-05-18 — phase 1A revision: real desk + camera pull-back
- Did: Owner direction received: (a) change camera not door-spill; (b) real desk with legs not a flat slab; (c) lamp ON the desk. **Camera**: pulled back to `(0, 1.15, 2.2)` looking at `(0, 0.4, 0)`; frustum math confirms the door spill target at z=+1.0 lands inside the visible frame (centerline 18.8° down, bottom-of-screen ray reaches floor at z≈1.2, spill at z=1.0 is just inside that). **DOOR_SPILL_POSITION reverted to spec `[-1.8, 0.4, 1.0]`** — the prior z=-0.4 deviation is no longer needed. **Desk geometry**: rebuilt `DeskSurface` as a 2.0m × 0.9m × 4cm top (was 1.8m) on four cylindrical legs (radius 2.5cm, height 70cm, inset 6cm from corners). Floor moved to y=-0.74 (standard desk height below the desk top). The width bump from 1.8 → 2.0m puts the lamp at x=-0.95 cleanly ON the desk surface rather than past its left edge. **Lamp** now passes `position={[LAMP_POSITION[0], 0, LAMP_POSITION[2]]}` with y=0 (desk top) instead of y=-0.05 (old floor convention). Back wall recentered (y=0.51, height 2.5m) so it spans from floor to ~half a meter above eye-line.
- Screenshot: real-feeling desk with visible legs, lamp on top with banker's-shade pool catching the desk surface, warm patch from door spill visible on the floor camera-left beyond the back-left leg, wall gradient warm→cool intact, back wall stops scene from "ending in void." All 5 acceptance criteria now read TRUE (criterion 4 still ⚠️ pending object placement).
- Why: First lighting-only gate had a slab-on-floor look that wasn't a real desk. Owner asked for a genuine elevated surface.
- Next: WAIT for owner "ship it" on this state. Do not add monitors / objects / window / restyled AudioToggle.

## 2026-05-18 — phase 1A checkpoint-a-revision: lighting-only gate
- Did: New branch `phase-1A/checkpoint-a-revision` off `main` per the revision prompt. Committed `lighting-plan.svg` as the canonical lighting reference. **Stripped DeskScene to the lighting-only baseline** the gate requires: 10m × 10m floor (BG_PANEL, receiveShadow), 3m × 2.5m back wall at z=-1.2 (BG_PANEL, receiveShadow), desk surface only (no monitors, no other objects). **Rebuilt Lamp** per the lamp-shape spec: open-hemisphere shade (`SphereGeometry` with `thetaStart=0, thetaLength=PI/2` — top half of a sphere with the rim opening downward), simple straight arm computed from base→bulb vector (no chained rotations), small bulb mesh at bulb position using `MeshBasicMaterial + toneMapped:false` so bloom catches it, separate inner-shade emissive surface for the warm bounce. **Lights** wired exactly to lighting-plan values: ambient 0.15 BG_NIGHT; KEY pointLight LAMP_WARM intensity 8 distance 2 decay 2 at (-0.95, 0.35, -0.2) with `castShadow shadow-mapSize=[1024,1024] shadow-bias=-0.0005`; two FILL pointLights VOXEL_GLOW intensity 3.2 distance 1.5 at monitor positions; RIM directionalLight VOXEL_GLOW_SOFT intensity 1.2 from (1.4, 1.0, -0.6) toward (0, 0.5, 0); DOOR SPILL pointLight LAMP_WARM intensity 2.4 distance 2.5. Bloom thresholds re-tuned (warm 0.6, cool 0.3). Floor placed 5cm below desk-bottom to avoid z-fighting with desk-top.
- Deviation from spec: DOOR SPILL position changed from `[-1.8, 0.4, 1.0]` to `[-1.6, 0.4, -0.4]`. Per camera-frustum math at FOV 50° from (0, 1.15, 1.8) looking at (0, 0.8, 0), the bottom-of-screen floor ray hits z≈0.22 — the original z=+1.0 puts the spill pool BELOW the visible frame entirely. The revision prompt explicitly allows position adjustment when the spill isn't visible ("check the light's position relative to the camera frustum"). New position lands the pool on the back-left floor (z=-0.4, visible), with the light source itself at x=-1.6 still outside the horizontal FOV so the "off-frame" metaphor is intact.
- Pass/fail vs the 5 acceptance criteria: (1) lamp pool brightest ✅; (2) right edge cooler than left ✅ (visible wall gradient); (3) warm rectangle on floor camera-left ⚠️ visible after the deviation, partially blending with the lamp's own pool; (4) keyboard area in ~20% falloff ⚠️ keyboard not placed yet but its zone z≈0.2 sits in the outer falloff; (5) no pure black / no flat ambient ✅.
- Why: First Checkpoint A had `mood-missing` — flat, generic lighting because the lighting wasn't verified before geometry was layered on. This branch redoes step 1 of the new mandatory gate.
- Next: WAIT for owner "ship it" on the lighting. Do not add monitors / objects / window / restyled AudioToggle until lighting is approved.

## 2026-05-18 — phase 1 checkpoint A — REJECTED, runtime fix
- Did: Owner rejected Checkpoint A — `pnpm dev` was failing with `Uncaught SyntaxError: The requested module '/@react-refresh' does not provide an export named 'injectIntoGlobalHook'`. Root cause: `vite-plugin-glsl` warns at startup that `@rollup/pluginutils` is missing (it's a peer dep on Vite <6.3); without it, the plugin's file-extension filter degenerates and stringifies modules it shouldn't transform — including `/@react-refresh` — which breaks Fast Refresh. A separate `react-refresh@^0.18.0` had also been hoisted into dependencies by an earlier edit, removed via the system reminder before I got there. Fix applied: dropped `vite-plugin-glsl` from `package.json` and removed its import from `vite.config.ts` (no `.glsl` files exist yet; the rain shader in 1.18 will re-evaluate the GLSL pipeline). Removed the now-orphan `*.glsl` ambient-module decl from `vite-env.d.ts`. Added `.claude/launch.json` so the Claude Preview tool can manage the dev server. Verified end-to-end: server boots clean, console clean except for the React Router v7 future-flag warnings (non-blocking) and a React DevTools recommendation; screenshot confirms the canvas renders.
- Also did: stopped claiming acceptance based on typecheck/lint/build passing alone. The screenshot reveals real composition problems that need to land before any re-review: the lamp geometry isn't visible from the camera (arm rotation chain places shade off-frame), monitor emissives are too saturated (intensity 0.55/0.4 with `toneMapped:false` is washing both screens to flat color), no bloom is reaching the scene (luminance threshold 0.9 against current exposure probably too high, or the EffectComposer is bypassing under default DPR), and the lamp pool that should anchor the composition isn't on the desk at all. The mug and plant are off-frame from this camera tightness.
- Why: System literally didn't run. Even with it running, the composition fails 1.8 — eye doesn't land on the lamp pool, monitors dominate.
- Next: Wait for owner direction on whether to tune the existing scene (re-position lamp, re-tune emissives + bloom, widen camera framing) or roll back to a smaller checkpoint A scope. Do not iterate visually without owner input.

## 2026-05-18 — phase 1 checkpoint A
- Did: **1.1** — `DeskRoute` camera moved to seated first-person at `[0, 1.15, 1.8]`, looking at `[0, 0.8, 0]`, FOV 50°, fixed (no orbit). **1.2** — extracted lighting constants to `src/scenes/desk/lighting.ts`; `DeskScene` now mounts ambient (0.06 / `BG_NIGHT`), warm key PointLight (`LAMP_WARM`, intensity 6.5, decay 1.8), two cool monitor fill PointLights (`VOXEL_GLOW`), cool window rim DirectionalLight (`VOXEL_GLOW_SOFT`, 0.35), and a door-spill PointLight (`LAMP_WARM`) hitting the floor camera-left — no door geometry. **1.3** — added `@react-three/postprocessing`; `BloomLayer` runs two `<Bloom>` passes (wide warm threshold 0.9 + tight cool threshold 0.4) inside `<EffectComposer>`. Adaptive perf: new `useAdaptiveFps(50, 2000)` hook disables bloom on sustained low FPS; also disabled under `prefersReducedMotion`. Dropped `KernelSize` import to avoid pulling `postprocessing` peer dep into the bundle. **1.4** — `.grain::after` now animates `background-position` via a 6s `steps(6, end)` keyframe; freezes and fades when `data-reduced-motion='true'`. **1.5** — `DeskSurface` is a 1.8×0.9m matte dark wood box (`BG_PANEL`, roughness 0.85) with a thin profile so the front edge catches the lamp rim. **1.6** — eleven hand-built objects under `src/scenes/desk/objects/`: `Monitor` (parameterized variant primary/terminal with emissive screen tint per role), `Keyboard` (TKL, 60-ish caps + a spacebar slot), `Mug` (tapered cylinder + handle), `Plant` (pot + 6 radiating leaf planes), `Headphones` (two cups + half-torus band, lying flat), `Notebook` (closed A4-ish + amber bookmark), `Phone` (face-down with camera-bump), `Lamp` (base + two-segment arm + shade + emissive bulb), `Window` (frame + cool-tinted glass + 3 placeholder rain streaks). **1.7** — all materials reference named exports from `colors.ts`; monitor 1 emissive = `SIGNAL_AMBER_DIM`, monitor 2 emissive = `VOXEL_GLOW_SOFT`; mug/phone/headphones tuned with low-roughness/higher-metalness to catch the lamp; notebook/desk/plant pot matte.
- Why: Phase 1 Checkpoint A — populated lit desk before any interaction logic.
- Next: WAIT for owner review. Three screenshots + bundle output to follow in the chat summary. Do not begin Checkpoint B until approved.

---

*Earlier Phase 0 entries (docs bootstrap, scaffold, 0.5 fixes A1–C5, 0.6 workflow infrastructure, 0.7 tool-use hooks, auto-sync entries) removed for readability. Full history retrievable via `git log -- worklog.md` if needed.*

## 2026-05-17 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`6af30fb`)

## 2026-05-18 — auto-synced from git log
- chore(infra): add tool-use hooks and tooling rules (`34a80c7`)
- chore(infra): untrack transient phase prompt files (`7f33b59`)
- chore(ci): refresh phase status [skip ci] (`aabc3e9`)
- chore(deps): add @react-three/postprocessing for desk bloom (`18dc1cf`)
- feat(desk): cinematic seated camera and key/fill/rim lighting (`cf0da66`)
- feat(desk): build desk surface and eleven hand-built objects (`a8730fa`)
- feat(desk): add adaptive bloom on lamp and monitor emissives (`2061cc3`)
- style(desk): animate film grain at 24fps when motion allowed (`2adde85`)
- fix(infra): drop vite-plugin-glsl to unblock dev server (`96e300b`)

## 2026-05-19 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`f0ef9ee`)

## 2026-05-20 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`8ea5ca7`)

## 2026-05-21 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`a5c012c`)

## 2026-05-22 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`a9f35da`)
- feat(desk): phase 1a — night desk scene with lighting and shadows (`e9f873e`)
- chore(ci): refresh phase status [skip ci] (`9e35c35`)
- feat(content): interaction store, lazy project loader, 3 projects (`14ce23e`)
- feat(desk): hover labels, emissive lift, camera glide rig (`d023196`)
- feat(overlay): scene panel, project panel, back-to-desk affordance (`c28fc2e`)
- fix(desk): suppress hover label while a panel is focused (`63860e0`)
- feat(content): build-time github activity fetch and typed loader (`de6f50e`)
- feat(overlay): terminal panel driven by github activity (`8dda2d2`)
- feat(content): notebook panel with two writing pieces (`b76793e`)
- feat(desk): phone flip-to-reveal contact email (`6b2973f`)
- feat(audio): tone.js lo-fi loop on the headphones toggle (`b83332e`)
- feat(desk): wire monitor2, notebook, phone, headphones, window (`1d92e0c`)

## 2026-05-23 — auto-synced from git log
- style(desk): flip mug handle to the camera-facing side (`c055eea`)
- fix(desk): pull phone onto desk and lift it during the flip arc (`61ca673`)
- fix(desk): mug handle attaches to body, phone clearly on desk (`e10b550`)
- chore(ci): refresh phase status [skip ci] (`23bf52a`)
- feat(motion): add usemediaquery + ismobile in scenestore (`12a258b`)
- feat(desk): mobile scene variant — camera, bloom off, simpler kb (`c6cdee9`)
- feat(overlay): mobile tap-to-arm + full-screen panel + swipe close (`05e4816`)
- style(a11y): mobile audio toggle top-right + stepped typography (`1d23eb3`)
- chore(ci): playwright state-capture script for visual evidence (`5577ca5`)
- docs: close phase 1b, mark checkpoint c active (`6ef5005`)
- chore(ci): refresh phase status [skip ci] (`d9dcf50`)
- chore(ci): refresh phase status [skip ci] (`5a3a202`)

## 2026-05-24 — auto-synced from git log
- fix(infra): prerender /text shell so lhci static server can serve it (`6960a53`)
- fix(a11y): bump eyebrow contrast past wcag aa on /text (`8b54515`)
- perf(desk): modulepreload deskroute chunk for / lcp (`ad3aec1`)
- docs(infra): relax nfr-4 perf bar to 70 with documented rationale (`6f641b4`)
- docs: close phase 1, mark phase 2 active (`95ef128`)
- chore(ci): refresh phase status [skip ci] (`7cd3517`)
- feat(data): phase 2a replay-first spine (`619197c`)
- feat(data): phase 2b orchestrator, marketstore, window indicator (`91da288`)

## 2026-05-25 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`6fbfd3b`)
- refactor(data): namespace dev hooks under __market + orch docs link (`e4a5789`)
- feat(audio): phase 2c sonification engine + marketstore tick bus (`aca9250`)
- docs(roadmap): close phase 2 — all three checkpoints done (`2692f88`)
- chore(ci): refresh phase status [skip ci] (`5248cc5`)
- feat(city): phase 3a city foundation — sky dome, river, fog, lighting (`3df8600`)

## 2026-05-26 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`dfffd92`)

## 2026-05-27 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`dea889f`)

## 2026-05-28 — auto-synced from git log
- feat(city): phase 3b buildings — github fetch, layout, style variants (`fdd0525`)
- feat(city): phase 3c interactions — camera rig, hover, click, panel (`b23d880`)
- fix(city): 3c review — centralize layout, fix poses, contextual back (`2301259`)
- feat(city): phase 3d transitions — window glide, deep-link, og image (`fc5c0e4`)
- chore(ci): refresh phase status [skip ci] (`dfa56e0`)

## 2026-05-29 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`a8155b0`)

## 2026-05-30 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`7742557`)

## 2026-05-31 — auto-synced from git log
- docs(roadmap): close phase 3 — all four checkpoints done (`adb6044`)
- chore: update phase status to phase 4 in-progress (`51e94fb`)
- feat(nn): concrete hall geometry + instanced attention-head columns (`afb4e99`)
- feat(nn): scene composition — fog, hemisphere, directional shafts (`230c193`)
- feat(nn): first-person walk controls (wasd, drag-look, clamped) (`17cd206`)
- feat(overlay): nn placeholder, css-only flickering concrete fallback (`8687f87`)
- feat(nn): route — canvas, scene, controls, shared data spine (`f384fc0`)
- feat(infra): prerender /nn route with nn-specific meta tags (`4954b0c`)
- chore(infra): playwright capture script for 4a verification (`19f7038`)
- docs(nn): worklog entry for phase 4a scaffolding (`5d73069`)
- feat(nn): nn settings store — high-fi toggle for u20 (`371cbba`)
- feat(nn): wall-embedded neuron lights with breathing pulse (`5084d6d`)
- feat(nn): token-path particle splines, gated by hi-fi setting (`4035dae`)
- feat(nn): bloom postfx layer, hi-fi gated (`ee142bd`)
- feat(overlay): hi-fi toggle (u20) (`05a065d`)
- feat(nn): wire neuron lights, splines, bloom, fidelity toggle (`f33d089`)
- fix(nn): brighten neurons + splines, fix wall-inset clipping (`9cd91ce`)
- chore(infra): playwright capture for 4b activations (`aa5cbee`)
- docs(nn): worklog entry for phase 4b activations (`273eea9`)
- chore(ci): refresh phase status [skip ci] (`054f9bd`)
- feat(nn): chamber configuration — gap-placed side rooms + inference room (`94db62f`)
- feat(nn): chamber prefab with entry-trigger activation flash (`889bff1`)
- feat(nn): drei html chamber wall-panel with project content typography (`593e63f`)
- feat(nn): u24 inference chamber — typed prompt, 4-layer attention viz (`c5efaf4`)
- feat(nn): wire chambers + inference chamber into the scene (`648c0ed`)
- chore(infra): 4c playwright capture + worklog entry (`051700f`)
- feat(nn): back-to-desk affordance + inbound fade-in + audio scene (`d537262`)
- feat(desk): door-spill hit area + transition to /nn (`913c846`)
- feat(city): neural gateway building → transition to /nn (`eb3d002`)
- feat(audio): nn drone bus with traversal-modulated filter cutoff (`1d5e762`)
- feat(nn): mobile tap-to-walk waypoints + camera glide (`e052a88`)
- docs(nn): worklog entry for phase 4d close (`da914d0`)

## 2026-06-01 — auto-synced from git log
- chore(ci): refresh phase status [skip ci] (`9e9418e`)
- docs(roadmap): close phase 4 — all four checkpoints done (`57f4f15`)
- feat(city): overhaul ui/ux visual density and camera controls (`f0f3e78`)
- chore(ci): refresh phase status [skip ci] (`226b5e8`)

## 2026-06-02 — auto-synced from git log
- fix(city): add streetlight cones and polish desk/routing ux (`3e22b04`)
- fix(city): fix street lamp visibility and increase ground contrast (`f065592`)
- chore(ci): refresh phase status [skip ci] (`104b3e5`)
- chore(ci): unify roadmap metadata sync and fix push race conditions (`037c30c`)

## 2026-06-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`389e110`)
- feat(city): add curated district and premium description overrides (`df61ecd`)

## 2026-06-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`a186ab9`)
- feat(city): reorganize voxel city into four custom themed districts (`bb4d796`)

## 2026-06-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`d58d066`)
- fix(city): fix building culling and integrate dynamic roblox-style zoom (`df377e2`)

## 2026-06-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`c8d3f22`)
- fix(city): implement smooth roblox-style zoom and brighten streetscape (`06c4d07`)

## 2026-06-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`31fddc9`)

## 2026-06-03 — auto-synced from git log
- fix(city): set first-person spawn to center and make z=0 street blue (`dfad638`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`9ea78cb`)
- fix(city): maintain consistent perspective during camera switches (`b9ce79d`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`e167da2`)
- fix(city): sync orbit yaw dynamically in street view to match street yaw (`ea04b5d`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`834e50e`)
- fix(city): prevent camera auto-glide to center on street pov entry (`5f42820`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`fb161b4`)
- fix(city): glide directly to center street spawn (`4b38ce2`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`798d620`)
- fix(a11y): add focus tabindex to scrollable main container (`8d477ac`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`8a87f7f`)
- chore(ci): trigger metadata sync on cron and manual only (`23f4a58`)

## 2026-06-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`6fa2e2b`)

## 2026-06-04 — auto-synced from git log
- feat(desk): implement keyboard focus, rain overlay & monitor gradients (`c416290`)

## 2026-06-04 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2d8a54e`)

## 2026-06-05 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`004e253`)

## 2026-06-06 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2041744`)

## 2026-06-07 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2e6f3ad`)

## 2026-06-04 — auto-synced from git log
- refactor(desk): swap monitor gradient hex literals for design tokens (`846e77a`)
- fix(city): freeze gateway beam pulse under prefers-reduced-motion (`d6cac85`)
- fix(content): align project district fields with city taxonomy (`914f78c`)
- docs(roadmap): mark phase 5 content + a11y items completed (`c841535`)

## 2026-06-05 — auto-synced from git log
- feat(nn): add n8ao ambient occlusion to nn postfx pipeline (`b7b9273`)
- feat(nn): apply concrete033 pbr maps to hall surfaces (`a788aa5`)

## 2026-06-08 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`36e52ce`)

## 2026-06-09 — auto-synced from git log
- docs(nn): worklog entry for concrete pbr + ssao visual upgrade (`decefdf`)

## 2026-06-04 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2d8a54e`)

## 2026-06-05 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`004e253`)

## 2026-06-06 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2041744`)

## 2026-06-07 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2e6f3ad`)

## 2026-06-08 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`36e52ce`)

## 2026-06-09 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`275a4a4`)

## 2026-06-10 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`da76277`)

## 2026-06-11 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`867ba47`)

## 2026-06-12 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`3d80305`)

## 2026-06-13 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`57938c2`)

## 2026-06-14 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`cd8f2d1`)

## 2026-06-15 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`1e03fe6`)

## 2026-06-16 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`d59a431`)

## 2026-06-17 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`c7ac398`)

## 2026-06-18 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`4f95738`)

## 2026-06-19 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`3d103ce`)

## 2026-06-20 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`8e067b2`)

## 2026-06-21 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`7f9cc54`)

## 2026-06-22 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`180a306`)

## 2026-06-23 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`e8cf794`)

## 2026-06-24 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`b01fc3f`)

## 2026-06-25 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`5d85a5c`)

## 2026-06-26 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`41bbbda`)

## 2026-06-27 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`28d636f`)

## 2026-06-28 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`1ca6b5a`)

## 2026-06-29 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`9ff4411`)

## 2026-06-30 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`218275d`)

## 2026-07-01 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`632293f`)

## 2026-07-02 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`006a699`)

## 2026-07-03 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`f7460e9`)

## 2026-07-04 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`68a94fd`)

## 2026-07-05 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`a59d4fe`)

## 2026-07-06 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`304eb0b`)

## 2026-07-07 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`5900975`)

## 2026-07-08 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`4caba70`)

## 2026-07-09 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`8335d1b`)

## 2026-07-10 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2eb6438`)

## 2026-07-11 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`2b96c0e`)

## 2026-07-12 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`39be234`)

## 2026-07-13 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`fdeb4e0`)

## 2026-07-14 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`e910840`)

## 2026-07-15 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`5bc1866`)

## 2026-07-16 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`40d2a23`)

## 2026-07-17 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`9913e96`)

## 2026-07-18 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`aaf43bf`)

## 2026-07-19 — auto-synced from git log
- chore(ci): sync roadmap metadata [skip ci] (`5a912c4`)
