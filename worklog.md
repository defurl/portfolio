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

## 2026-05-17 — phase 0.6 workflow scaffolding
- Did: **Piece 1** — commitlint.config.cjs with the prompt's type/scope/subject rules; husky 9 installed via `prepare`; `.husky/commit-msg` runs commitlint, `.husky/pre-commit` runs `typecheck && lint && lint:colors`. **Piece 2** — `.husky/commit-msg` greps for `^Co-Authored-by:` before commitlint and exits 1 with the prescribed error; `ci.yml` added a `guard against Co-Authored-by trailers` step over the PR range (`origin/<base>..HEAD`) with `fetch-depth: 0`. **Piece 3** — `scripts/check-commit-size.mjs` warns on >500 lines OR >15 files per commit and hard-blocks on >2000; wired to `.husky/pre-push` with safe defaults (`origin/main..HEAD`, silent exit on missing remote). **Piece 4** — `scripts/sync-worklog.mjs` reads/writes the hidden `<!-- worklog-sync: lastCommitSha=… -->` marker, walks `git log marker..HEAD`, filters `docs(worklog):` subjects, groups by date, appends `## YYYY-MM-DD — auto-synced from git log` bullet entries; `.github/workflows/worklog-sync.yml` runs it on push to main with `contents: write`, commits as `github-actions[bot]` with `[skip ci]`. **Piece 5** — `CONTRIBUTING.md` covers the non-negotiable Co-Authored-by rule, branch model, commit format, hook list, branch-protection settings the owner must configure; `scripts/update-phase-status.mjs` reads `docs/04-roadmap.md`, finds the first phase with unchecked boxes, writes `phase-status.json`; `.github/workflows/phase-status.yml` runs on push + daily cron; `README.md` includes the shields.io dynamic-JSON badge.
- Why: Phase 0.6 — workflow infrastructure before Phase 1 starts dropping desk-object commits.
- Next: Wait for owner approval, then Phase 1 Checkpoint A.

## 2026-05-17 — auto-synced from git log
- chore(infra): gitignore claude local settings (`ce3533c`)
