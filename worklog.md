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
