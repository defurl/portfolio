<!-- worklog-sync: lastCommitSha=ce3533c98ed08120d3d0ff0f8fad2798938c0468 -->
# worklog.md

> One-line-per-line decision log. Append after every meaningful change.

## 2026-05-17 — Phase 0 docs bootstrapped
- Did: Authored `docs/00-vision.md`, `01-srs.md`, `02-prd.md`, `03-architecture.md`, `04-roadmap.md` per CLAUDE.md protocol.
- Why: Lock the thesis, requirements, MVP cut line, system shape, and phasing before any code is written.
- Next: Generate `engineering/repo-structure.md` and `engineering/data-sources.md`, then scaffold Vite + R3F + Tone.js per Phase 0 exit gate.

## 2026-05-17 — Phase 0 engineering docs
- Did: Wrote `engineering/repo-structure.md` and `engineering/data-sources.md`.
- Why: Make the file shape and the data-fallback ladder unambiguous before code.
- Next: Scaffold Vite + TS strict + React 18 + R3F + Tone.js + Zustand.

## 2026-05-17 — Phase 0 scaffold
- Did: Wrote package.json (R3F, drei, Tone.js, Zustand, react-router, marked, @fontsource/* for Fraunces+Geist), tsconfig (strict, exactOptionalPropertyTypes), vite.config (glsl plugin, manual chunks for three/r3f/tone), eslint flat config, .gitignore/.gitattributes (LFS for binaries). Wrote index.html with OG tags + /text alternate. Source skeleton: main.tsx, App.tsx (lazy CityRoute/NnRoute), DeskRoute with R3F Canvas + placeholder cube under warm lamp, City/Nn stubs, TextRoute that renders content/about.md via marked at build time. Overlay: AudioToggle (OFF by default, prominent), LoadingBar. Stores: audioStore, sceneStore. Lib: reducedMotion hook, data/types.ts, api/feed.ts edge stub. Tokens.css + globals.css carry the design-spec palette/type/motion. CI: typecheck, lint, build, bundle-budget guard (scripts/bundle-budget.mjs, 200KB gzipped), Lighthouse-CI (perf ≥85, a11y ≥90), axe smoke via Playwright. Vercel config with SPA rewrites + long-cache headers.
- Why: Phase 0 exit gate requires a styled empty desk with one cube under the lamp, plus the CI bars and deploy pipeline in place.
- Next: Run `pnpm install` locally, drop the Departure Mono woff2 in `public/fonts/`, push to a GitHub repo and connect Vercel. After that, Phase 1 (the real desk objects).

## 2026-05-17 — phase 0.5 fix A1
- Did: Made `DeskRoute` lazy alongside City/Nn so the entry chunk no longer pulls R3F; replaced Suspense fallback with CSS-only `LampPlaceholder` (warm radial glow on `--bg-void`).
- Why: A1 — `/text` was transitively importing R3F via the static `DeskRoute` import. Violated SRS FR-29.
- Next: A2 — emit the Vite manifest so the bundle-budget script is meaningful.

## 2026-05-17 — phase 0.5 fix A2
- Did: Added `manifest: true` to `vite.config.ts` so `dist/.vite/manifest.json` is emitted.
- Why: A2 — `scripts/bundle-budget.mjs` was silently summing every JS file because the manifest didn't exist.
- Next: A3 — honor prefers-reduced-motion inside R3F frames.

## 2026-05-17 — phase 0.5 fix A3
- Did: Added `prefersReducedMotion` + `setPrefersReducedMotion` to `sceneStore`; gated `PlaceholderCube` `useFrame` rotation behind `useSceneStore.getState().prefersReducedMotion`; added the convention comment for Phase 1.
- Why: A3 — the CSS reduced-motion rule never reached R3F frames; AR-2 was violated.
- Next: A4 — make the color guard enforceable.

## 2026-05-17 — phase 0.5 fix A4
- Did: Created `scripts/lint-colors.mjs` that scans `src/**/*.{ts,tsx,css}` for banned hex literals and exits 1 on hit; removed the dead `BANNED_HEX` const from `eslint.config.js`; added `lint:colors` script and a CI step after `lint`.
- Why: A4 — the color guard was vapor; now it's enforced.
- Next: A5 — wire useReducedMotion in App root.

## 2026-05-17 — phase 0.5 fix A5
- Did: `App.tsx` is now the sole `useReducedMotion()` subscriber and pushes the value into `sceneStore`; `.grain[data-reduced-motion='true']::after` hides the film grain.
- Why: A5 — single subscription point keeps descendants cheap and AR-2 honored even at the overlay layer.
- Next: B1 — flip the data-feed architecture in the docs.

## 2026-05-17 — phase 0.5 fix B1
- Did: Updated architecture §9 and `engineering/data-sources.md` so signed-URL handoff is the primary live-data path; edge WS proxy is the fallback; added D6 (key rotation cadence).
- Why: B1 — Vercel Edge isn't built for sustained WS; the prior design would cost a week in Phase 2.
- Next: B2 — reconcile roadmap Phase 0 with reality.

## 2026-05-17 — phase 0.5 fix B2
- Did: Checked off Phase 0 items that are actually done; left Vercel-project and Departure Mono woff2 unchecked (owner actions); added Phase 0.5 line and checked it.
- Why: B2 — the roadmap is the "where are we" doc and was out of sync with worklog.
- Next: B3 — switch content-loading strategy to lazy.

## 2026-05-17 — phase 0.5 fix B3
- Did: Rewrote architecture §8 to specify lazy per-project body loading via non-eager `import.meta.glob`; entry bundle gets only `content-index.json`; `/text` stays eager for SEO/screen-readers; `contentStore` shape updated to `projects + bodies Map`.
- Why: B3 — eager glob would have blown the 200KB budget once real content arrives.
- Next: B4 — rewrite SRS FR-26.

## 2026-05-17 — phase 0.5 fix B4
- Did: Rewrote FR-26 to separate the visual toggle state (persistent) from audio context initialization (always requires a user gesture per session).
- Why: B4 — the prior wording was self-contradictory.
- Next: B5 — add NFR-26, Q6/Q7, bump LHCI a11y to 0.95.

## 2026-05-17 — phase 0.5 fix B5
- Did: Added SRS NFR-26 (a11y ≥95), bumped `lighthouserc.json` a11y to 0.95, added PRD Q6 (Finnhub WS practicality) and Q7 (desk-window canvas perf budget).
- Why: B5 — SRS/PRD/LHCI bars were inconsistent on a11y; two known unknowns weren't tracked.
- Next: B6 — add Phase 5.5 soak.

## 2026-05-17 — phase 0.5 fix B6
- Did: Inserted Phase 5.5 soak (½ week, external user tests + 24h prod soak + disconnect/audio re-verification on deployed build) between Phase 5 and Phase 6; removed the "week 8" tag on Phase 6 and updated the risk-table reference.
- Why: B6 — polish phases always slip; no buffer meant launch slip = visible slip.
- Next: C1 — rename `Symbol` type to `Ticker`.

## 2026-05-17 — phase 0.5 fix C1
- Did: Renamed `Symbol` → `Ticker` in `src/lib/data/types.ts` and `engineering/data-sources.md`.
- Why: C1 — avoid shadowing the global `Symbol` constructor at use sites.
- Next: C2 — move AudioToggle to bottom-right; document corner allocation.

## 2026-05-17 — phase 0.5 fix C2
- Did: Moved `AudioToggle` to bottom-right; added `composition.corner_allocation` to `design-spec.jsonc` reserving bottom-left for back-to-desk, top-right for transient panels (project detail slides), top-left for scene eyebrow.
- Why: C2 — Phase 1 back-to-desk affordance would have collided with the audio toggle.
- Next: C3 — tighten .gitattributes LFS rules.

## 2026-05-17 — phase 0.5 fix C3
- Did: Removed `*.png` and `*.jpg` LFS rules from `.gitattributes`; documented the per-file LFS opt-in for raster assets >1MB in `engineering/repo-structure.md`.
- Why: C3 — auto-LFS for icons/favicons would have complicated free-tier Vercel deploys.
- Next: C4 — materials use design tokens.

## 2026-05-17 — phase 0.5 fix C4
- Did: Created `src/lib/style/colors.ts` (named constants + `colors` object) mirroring `tokens.css`; replaced all hex literals in `DeskScene.tsx` with named imports.
- Why: C4 — palette drift between TS and CSS land was a regression waiting to happen.
- Next: C5 — fix CI Lighthouse/preview-server inconsistency.

## 2026-05-17 — phase 0.5 fix C5
- Did: Replaced `pnpm preview` in CI with `npx serve dist -p 4173` for axe smoke; Lighthouse continues to use `staticDistDir` (faster, no orphan server). Both now serve from the built `dist/`.
- Why: C5 — `lighthouserc.json`'s `staticDistDir` was ignoring the spun-up preview server, leaving a hanging process.
- Next: verification block — typecheck, lint, build, manifest inspect.

## 2026-05-17 — phase 0.5 verification
- Did: Ran `pnpm install`, `typecheck`, `lint`, `lint:colors`, `build`, `bundle:check` — all pass. Discovered that the `manualChunks: { three, r3f, tone }` config in `vite.config.ts` was injecting `<link rel="modulepreload">` for three/r3f into the entry HTML, defeating the lazy-route boundary that A1 established. Removed `manualChunks` entirely; Rollup now code-splits purely on dynamic-import boundaries. Tightened eslint config to disable `react/no-unknown-property` (R3F intrinsics aren't HTML), `jsx-no-comment-textnodes`, and `no-unescaped-entities`. Entry chunk dropped to 63KB gzipped; three/r3f are in the `DeskRoute` lazy chunk; manifest sync-import closure for entry is empty.
- Why: Required by the prompt's verification block; the manualChunks discovery is a follow-on correction to A1 (without it, A1's lazy-load was being undone by the bundler).
- Next: Wait for owner review. Do not start Phase 1.

## 2026-05-17 — phase 0.5 eslint scope tightening
- Did: Re-enabled `react/jsx-no-comment-textnodes` and `react/no-unescaped-entities` globally; scoped `react/no-unknown-property` disable to a `files: ['src/scenes/**/*.tsx']` override so DOM components stay guarded. Fixed the source the re-enabled rules flagged: removed `//` prefixes from the CityRoute/NnRoute stub text nodes; changed `quant's` → `quant&rsquo;s` in TextRoute (also reads better — curly apostrophe).
- Why: The prior blanket disables were too broad and would have suppressed real bugs outside the R3F scenes.
- Next: Wait for owner review. Do not start Phase 1.

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

## 2026-05-18 — phase 0.7 tool-use enforcement
- Did: **Piece 1** — `docs/tooling-rules.md` documents the canonical ruleset (file reads, search, build pipes, git, subagent thresholds, session hygiene, escape hatch, owner `compactPrompt` setup). **Piece 2** — appended a `Tool-use discipline` cliff-notes section to `CLAUDE.md` between "Repo conventions" and "Definition of done." **Piece 3** — three Node hook scripts under `scripts/claude-hooks/`: `bash-guard.mjs` (PreToolUse:Bash) denies bloaty `cat`/`type`, `ls -R`, bare `git log`/`git show`, unbounded `grep -r`/`rg`, and unpipped verbose `pnpm` commands; honors `# bypass:hooks` and logs to `.claude/hook-log.jsonl`. `read-guard.mjs` (PreToolUse:Read) denies whole-file reads >200 lines without offset/limit. `output-nudge.mjs` (PostToolUse) injects a `additionalContext` warning when any Bash/Read/Grep response exceeds ~5K tokens. **Piece 4** — `.claude/settings.json` wires all three hooks with a 5s timeout each; `.claude/hook-log.jsonl` added to `.gitignore`. **Piece 5** — owner `compactPrompt` block documented at the end of `docs/tooling-rules.md`. Bonus: `scripts/test-hooks.mjs` + `pnpm test:hooks` script asserts 9 cases (denials, allows, bypass logging, large-response nudge).
- Why: Phase 0.7 — Claude Code sessions burn 60–80% of context on tool output; rules alone aren't enough, so the hooks deny the most expensive footguns mechanically.
- Next: Wait for owner approval. After this lands, the open question is whether to run `/caveman-compress` on CLAUDE.md.

## 2026-05-17 — phase 0.6 workflow scaffolding
- Did: **Piece 1** — commitlint.config.cjs with the prompt's type/scope/subject rules; husky 9 installed via `prepare`; `.husky/commit-msg` runs commitlint, `.husky/pre-commit` runs `typecheck && lint && lint:colors`. **Piece 2** — `.husky/commit-msg` greps for `^Co-Authored-by:` before commitlint and exits 1 with the prescribed error; `ci.yml` added a `guard against Co-Authored-by trailers` step over the PR range (`origin/<base>..HEAD`) with `fetch-depth: 0`. **Piece 3** — `scripts/check-commit-size.mjs` warns on >500 lines OR >15 files per commit and hard-blocks on >2000; wired to `.husky/pre-push` with safe defaults (`origin/main..HEAD`, silent exit on missing remote). **Piece 4** — `scripts/sync-worklog.mjs` reads/writes the hidden `<!-- worklog-sync: lastCommitSha=… -->` marker, walks `git log marker..HEAD`, filters `docs(worklog):` subjects, groups by date, appends `## YYYY-MM-DD — auto-synced from git log` bullet entries; `.github/workflows/worklog-sync.yml` runs it on push to main with `contents: write`, commits as `github-actions[bot]` with `[skip ci]`. **Piece 5** — `CONTRIBUTING.md` covers the non-negotiable Co-Authored-by rule, branch model, commit format, hook list, branch-protection settings the owner must configure; `scripts/update-phase-status.mjs` reads `docs/04-roadmap.md`, finds the first phase with unchecked boxes, writes `phase-status.json`; `.github/workflows/phase-status.yml` runs on push + daily cron; `README.md` includes the shields.io dynamic-JSON badge.
- Why: Phase 0.6 — workflow infrastructure before Phase 1 starts dropping desk-object commits.
- Next: Wait for owner approval, then Phase 1 Checkpoint A.

## 2026-05-17 — auto-synced from git log
- chore(infra): gitignore claude local settings (`ce3533c`)
