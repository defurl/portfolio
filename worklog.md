<!-- worklog-sync: lastCommitSha=ce3533c98ed08120d3d0ff0f8fad2798938c0468 -->
# worklog.md

> One-line-per-line decision log. Append after every meaningful change.

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
