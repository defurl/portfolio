# Phase 0.5 — apply review feedback before Phase 1

You completed Phase 0 scaffolding. Two reviews followed: one on the docs, one on the scaffold zip. **Do not start Phase 1.** Apply every fix below first, in order, then stop and wait for the project owner to re-verify.

## Operating rules for this task

1. **Do not introduce new third-party dependencies.** Every fix should work with what's already in `package.json`.
2. **Do not make structural decisions not specified here.** If an instruction is ambiguous, leave a `// TODO(review):` comment and proceed; surface every TODO in your final summary.
3. **Append to `worklog.md` after each numbered fix lands** (one entry per fix), using the protocol in `CLAUDE.md`:
   ```
   ## YYYY-MM-DD HH:MM — phase 0.5 fix N
   - Did: [one line]
   - Why: [one line, reference the fix number]
   - Next: [one line, or "—"]
   ```
4. **Stop when all 17 fixes are applied and the verification block at the end passes.** Do not begin Phase 1 work. Do not preemptively scaffold the desk objects, lighting passes, or anything in `scenes/desk/objects/`.
5. **Re-read `CLAUDE.md`, `CONTEXT.md`, and `design-spec.jsonc` first.** These are the source of truth; this prompt is corrective application of them.

---

## Group A — Scaffold blockers (apply first)

### A1. Lazy-load `DeskRoute` so `/text` doesn't pull R3F

**Problem:** `src/App.tsx` statically imports `DeskRoute`, which statically imports `@react-three/fiber`. Visitors to `/text` therefore load R3F + three + drei. This violates SRS FR-29, architecture §6, and the rule in `engineering/repo-structure.md` ("`/text` import graph must not transitively pull `@react-three/fiber`").

**Fix:**
- In `src/App.tsx`, convert `DeskRoute` to a `React.lazy` import, alongside the existing lazy `CityRoute` and `NnRoute`.
- Keep `TextRoute` statically imported — it's the no-WebGL fallback and should be in the entry chunk.
- Replace the global `<Suspense>` fallback with a tiny CSS-only "desk light coming on" placeholder. No R3F, no JS animation — just a CSS keyframed warm-amber glow centered on a dark background. ≤ 1KB of CSS. Acceptance: visible within 100ms of cold paint on a slow network.

**Exit criteria:**
- `pnpm build` succeeds.
- Open `dist/.vite/manifest.json` (after A2 lands) and confirm the entry chunk's transitive `imports` array contains **no chunk** whose `src` references `@react-three/fiber`, `@react-three/drei`, or `three`.
- The CSS placeholder is visible and styled with design-spec tokens (paper-tone on `--bg-void`, amber glow via `--lamp-warm`).

### A2. Emit the Vite manifest so the bundle-budget script works

**Problem:** `scripts/bundle-budget.mjs` looks for `dist/.vite/manifest.json` to find the entry chunk's sync deps. `vite.config.ts` does not enable manifest emission, so the script silently falls back to summing every JS file in `dist/assets` — which includes lazy chunks. The 200KB check is meaningless until this is fixed.

**Fix:**
- In `vite.config.ts`, add `build: { manifest: true, target: 'es2022', sourcemap: true, rollupOptions: { ... existing ... } }` — preserve every existing build option, just add `manifest: true`.
- Verify the bundle-budget script's manifest path matches what Vite emits (`dist/.vite/manifest.json` is correct for Vite 5).

**Exit criteria:**
- `pnpm build` produces `dist/.vite/manifest.json`.
- `pnpm bundle:check` reports a number that matches expectations (post-A1, should be well under 200KB gzipped — likely 60–80KB).

### A3. Honor `prefers-reduced-motion` in 3D scenes

**Problem:** `src/scenes/desk/DeskScene.tsx` runs unconditional `useFrame` rotation on `PlaceholderCube`. The CSS `@media (prefers-reduced-motion: reduce)` rule in `globals.css` only affects CSS animations — Three.js `useFrame` ignores it. The `useReducedMotion` hook exists in `src/lib/motion/reducedMotion.ts` but isn't wired in. AR-2 is violated on day one.

**Fix:**
- In `DeskScene.tsx`, import `useReducedMotion` and gate the `useFrame` rotation: when reduced motion is requested, skip the rotation entirely (don't even register the frame callback — early-return inside the effect).
- Establish a pattern: every `useFrame` in this project consults `useReducedMotion()`. Add a brief comment near the gated frame block explaining the convention so Phase 1 follows it.
- Also: add `sceneStore.prefersReducedMotion` per architecture §3 (the store currently lacks it). Populate it on boot from the hook in `App.tsx` so scene-level audio/transition code can read it without each component re-hooking.

**Exit criteria:**
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → the cube stops rotating, lights remain on, no console errors.
- `useSceneStore.getState().prefersReducedMotion` reflects the OS setting and updates on change.

### A4. Make the design-spec color guard real

**Problem:** `eslint.config.js` declares `BANNED_HEX` as an unused const. A comment claims enforcement via `scripts/lint-colors.mjs`, which doesn't exist. `engineering/repo-structure.md` asserts an ESLint rule bans purple/indigo. Right now nothing is enforced.

**Fix:**
- Create `scripts/lint-colors.mjs`. It scans `src/**/*.{ts,tsx,css,module.css}` and JSX inline-style strings, matching against the `BANNED_HEX` regex currently in `eslint.config.js`. Report each match as `path:line:col → matched-substring`. Exit 1 on any match.
- Move the `BANNED_HEX` regex into the script (single source of truth) and remove the dead const from `eslint.config.js`.
- Add a `lint:colors` script to `package.json` and call it after `lint` in `.github/workflows/ci.yml`.
- Update the comment in `eslint.config.js` to reference the new script's path.

**Exit criteria:**
- `pnpm lint:colors` exits 0 on the current scaffold.
- Inserting a test string like `#8b5cf6` into any source file makes it exit 1 with a line number.
- Remove the test string after verification.

### A5. Wire `useReducedMotion` into the `App` root

(This is the second half of A3 — separated because it touches a different file.)

**Fix:**
- In `App.tsx`, call `useReducedMotion()` at the top level and write the result into `sceneStore` via an effect. This is the only place that should subscribe to the media query — descendants read from the store.

**Exit criteria:**
- `App.tsx` no longer renders without hydrating `sceneStore.prefersReducedMotion`.
- The grain overlay also fades to `opacity: 0` when reduced motion is on (currently it's static at 0.03, which is fine, but verify it isn't animating).

---

## Group B — Doc fixes from the prior doc review

### B1. Flip the data-feed architecture: signed-URL primary, edge-WS-proxy fallback

**Problem:** `docs/03-architecture.md` §9 and `engineering/data-sources.md` describe a Vercel Edge Function that proxies a long-lived WebSocket from Finnhub to the browser. Vercel Edge runtime is **not designed for long-lived WebSockets**, especially on the free tier. Treating it as the happy path will burn a week mid-build.

**Fix:**
- Update `docs/03-architecture.md` §9 to make the signed-URL pattern the **primary** design:
  - Browser calls `/api/feed/token`. Edge function returns a short-lived (60s TTL) signed URL containing the Finnhub WS key. The browser opens a direct WSS to Finnhub. Key rotates daily or weekly.
  - Edge function continues to proxy Alpha Vantage REST (no WS issue there) and serve replay metadata.
- Document the WS-proxy variant as a **fallback only** to be considered if the signed-URL approach proves untenable.
- Update `engineering/data-sources.md` "Edge function" and "If WS proxying proves flaky" sections accordingly. The fallback ladder state machine doesn't change.
- Add to architecture §13 deferred decisions: "D6 — Signed-URL key rotation cadence (daily vs weekly)."

**Exit criteria:**
- Architecture §9 reads as if signed-URL is the design intent, not the backup.
- `data-sources.md` matches.
- The `api/feed.ts` stub remains — the implementation change is a Phase 2 concern.

### B2. Reconcile the roadmap's Phase 0 checkboxes with worklog reality

**Problem:** `docs/04-roadmap.md` Phase 0 has only the two doc-writing items checked `[x]`. The worklog states package.json, vite.config, source skeleton, CI, Vercel config, tokens.css, and the placeholder cube are all done. The roadmap is the doc people consult for "where are we" — it has to be current.

**Fix:**
- In `docs/04-roadmap.md` Phase 0, check off every item that's actually been completed in the scaffold. Be specific — if `engineering/data-sources.md` exists, that line is `[x]`. If the Departure Mono woff2 isn't actually committed yet (check `public/fonts/`), leave it unchecked and add a note.
- Add a new line: `- [ ] Phase 0.5 review fixes applied (this work)` and check it off when the prompt is complete.

**Exit criteria:**
- Roadmap Phase 0 state matches reality. Anyone reading it can tell what's done and what's not.

### B3. Fix the content-loading strategy

**Problem:** `docs/03-architecture.md` §8 says content is read at build time via `import.meta.glob('/content/**/*.{md,json}', { eager: true })`. Eager glob ships every project's markdown into the entry bundle, which will blow the 200KB budget once content is real. This contradicts the lazy-loading goal of code-splitting per scene.

**Fix:**
- Update architecture §8 to specify: **lazy content loading.**
  - At build time, generate a small `content-index.json` with just `id`, `title`, `category`, `district`, `thesis`, and `links` for each project. This index is part of the entry bundle.
  - Per-project markdown bodies are imported on demand via `import.meta.glob('/content/projects/*.md', { query: '?raw', import: 'default', eager: false })`, returning a function that resolves to the raw string when invoked.
  - `lib/content/load.ts` exposes `getProjectIndex()` (sync) and `loadProjectBody(id)` (async).
  - `/text` route is the exception: it imports `about.md` eagerly (already does), and either eagerly loads all project bodies *only on that route* or shows them collapsed with on-demand `loadProjectBody`. Pick the eager path for `/text` since SEO/screen-readers want all content present.
- Update `contentStore` description in §3 to reflect: `projects: ProjectIndex[]` (eager) + `bodies: Map<id, string>` (lazy-filled).

**Exit criteria:**
- Architecture §8 reads as described. No code changes required in this fix — the implementation lands in Phase 1 when project content arrives.

### B4. Rewrite SRS FR-26 (audio persistence semantics)

**Problem:** FR-26 says audio state persists in `localStorage` but "never auto-enables on first visit per session origin." If localStorage persists across sessions, the rule is self-contradictory.

**Fix:**
- Rewrite FR-26 in `docs/01-srs.md` to:
  > **FR-26.** The audio enabled/disabled preference is persisted in `localStorage` across sessions, but audio playback never starts without a user gesture in the current page session — even if the prior preference was "enabled." On page load, the toggle reflects the persisted preference visually, but the audio context remains uninitialized until the user explicitly engages the toggle (or any other element that grants audio permission).

**Exit criteria:**
- FR-26 reads unambiguously. The visual state and the audio-playback state are clearly separate.

### B5. Add NFR-26 (Lighthouse a11y ≥95) and align all bars

**Problem:** PRD U17 requires Lighthouse a11y ≥95. SRS doesn't have a matching NFR. `lighthouserc.json` sets the bar at 0.9, not 0.95.

**Fix:**
- Add to `docs/01-srs.md` §4: `**NFR-26.** Lighthouse Accessibility score ≥ 95 on `/` and `/text`.`
- Update `lighthouserc.json` `categories:accessibility` minScore from `0.9` to `0.95`.
- Add to `docs/02-prd.md` §7 open questions:
  - `Q6. Finnhub free-tier WebSocket subscription practicality (target resolution: Phase 2).`
  - `Q7. Whether the secondary desk-window city canvas can sustain 50fps; if not, define the static-fallback condition (target resolution: Phase 3).`

**Exit criteria:**
- SRS has NFR-26.
- PRD has Q6 and Q7.
- `lighthouserc.json` enforces 0.95.

### B6. Add a half-week soak between Phase 5 and Phase 6

**Problem:** Roadmap Phase 6 (launch) starts the same week as Phase 5 finishes. Polish phases always slip. No buffer.

**Fix:**
- In `docs/04-roadmap.md`, insert a new "Phase 5.5 — Soak (½ week)" between Phase 5 and Phase 6. Items: external user test (one Tier 1, one Tier 2 audience member); 24-hour live preview soak on the production domain before public announcement; final pass on OG image and meta tags; verify the disconnect test and the 30-second audio test pass on the deployed build, not just local.
- Adjust the "week 8" tags downstream: Phase 6 becomes "week 8½" or just remove week tags and rely on phase ordering.

**Exit criteria:**
- Roadmap has six phases plus Phase 5.5.
- The risk table at the bottom no longer needs the "slipping into week 9+" entry as urgently — keep it, but it now reflects the realistic timeline.

---

## Group C — Scaffold concerns

### C1. Rename `Symbol` → `Ticker`

**Problem:** `src/lib/data/types.ts:1` declares `export type Symbol = string`, which shadows the global `Symbol` constructor. Even as a type-only export, it'll confuse use sites.

**Fix:**
- Rename `Symbol` to `Ticker` in `types.ts`.
- Update all references in `engineering/data-sources.md` and any other place that mentions the type. (No other source files reference it yet.)

**Exit criteria:** `pnpm typecheck` passes. No `Symbol` type alias remains.

### C2. Resolve the overlay corner collision

**Problem:** `AudioToggle.module.css` puts the toggle at `bottom: 1.5rem; left: 1.5rem`. Phase 1 FR-4 plans a "back to desk" affordance in the same corner. The design-spec rule is overlay UI in bottom-left + top-right.

**Fix:**
- Move `AudioToggle` to `bottom-right` (still on the desk scene, still visible on first paint).
- Reserve `bottom-left` for "back to desk" (will be added in Phase 1).
- Reserve `top-right` for transient panels (project detail slides in there).
- Document this layout reservation in `design-spec.jsonc` under `composition.dom_overlay_rules` — add a sub-list mapping corners to roles.

**Exit criteria:** `AudioToggle` renders bottom-right. `design-spec.jsonc` documents the corner allocation.

### C3. Tighten `.gitattributes` LFS rules

**Problem:** All `.png` and `.jpg` are LFS-tracked. Tiny icons and favicons don't need LFS and complicate free-tier Vercel deploys.

**Fix:**
- Remove `*.png filter=lfs ...` and `*.jpg filter=lfs ...` from `.gitattributes`.
- Keep LFS for: `.glb`, `.gltf`, `.ktx2`, `.ogg`, `.mp3`, `.wav`, `.woff2`.
- Add a note in `engineering/repo-structure.md` under "Asset conventions": "Prefer SVG for icons. Raster images >1MB should be hand-added to LFS via `git lfs track` on the specific file."

**Exit criteria:** `.gitattributes` no longer LFS-tracks raster images by extension. Doc updated.

### C4. Materials use design tokens

**Problem:** `DeskScene.tsx` hard-codes hex strings for the lamp, monitor fill, desk surface, and cube color. They match the spec now but won't track changes to `tokens.css`.

**Fix:**
- Create `src/lib/style/colors.ts` exporting a typed `colors` object with every value from the design-spec palette (mirror of `tokens.css`). Export keys as named constants too (e.g., `LAMP_WARM`, `BG_PANEL`).
- Replace every hex literal in `DeskScene.tsx` with a reference to this object.
- Add a comment at the top of `colors.ts` noting that this file and `tokens.css` are the two mirrors of the design-spec palette; both must update together. Cite `scripts/lint-colors.mjs` (created in A4) as the guard.

**Exit criteria:** No hex literals in `DeskScene.tsx`. `pnpm lint:colors` still passes.

### C5. CI Lighthouse port consistency

**Problem:** `.github/workflows/ci.yml` starts `pnpm preview --port 4173 &` and waits for it, but `lighthouserc.json` uses `http://localhost/` with `staticDistDir: "dist"` — so LHCI ignores the preview server and serves dist itself.

**Fix:** Pick one path. Recommended:
- Remove the preview/wait-on steps from the workflow.
- Keep `lighthouserc.json` as-is — `staticDistDir` is simpler and faster.
- Update the `a11y:check` step to also serve `dist` via a one-liner (e.g., `npx serve dist -p 4173 &`) instead of `pnpm preview`. Or, switch `a11y-smoke.mjs` to use Playwright's built-in static server.

**Exit criteria:** CI runs without an orphaned preview server. Both Lighthouse and axe smoke serve from the built `dist/`.

### C6. (Reserved — no action)

(Skipped — concerns 1–5 are sufficient.)

---

## Verification block (run before declaring this task complete)

After all fixes above:

1. `pnpm install --frozen-lockfile` → succeeds.
2. `pnpm typecheck` → succeeds.
3. `pnpm lint` → succeeds with `--max-warnings=0`.
4. `pnpm lint:colors` → succeeds.
5. `pnpm build` → succeeds and emits `dist/.vite/manifest.json`.
6. `pnpm bundle:check` → reports an honest initial-chunk size; gate at 200KB passes with headroom.
7. **Manifest check (manual but required):** open `dist/.vite/manifest.json`. Locate the entry chunk (the one with `isEntry: true`). Walk its `imports` array transitively. Confirm **no chunk** in that closure has a `src` that includes `react-three`, `three`, or `drei`. Paste the entry chunk + its immediate `imports` array into your summary.
8. `pnpm dev` → visit `/` → the placeholder cube rotates under the warm lamp.
9. `pnpm dev` → visit `/` with DevTools "Emulate prefers-reduced-motion: reduce" → cube stops rotating, scene still rendered.
10. `pnpm dev` → visit `/text` → about content renders, no console errors, Network tab shows no R3F chunks loaded.
11. The roadmap accurately reflects what's been done.

If any of these fail, fix and re-run the block. **Do not begin Phase 1 until every check passes.**

## Final summary (post in chat when done)

When complete, summarize in this format:

- **Blockers applied:** A1, A2, A3, A4, A5
- **Doc fixes applied:** B1, B2, B3, B4, B5, B6
- **Concerns applied:** C1, C2, C3, C4, C5
- **Manifest check output:** [paste]
- **Bundle budget output:** [paste]
- **Outstanding TODOs (if any):** [list]
- **Anything you changed that wasn't in this prompt:** [list, with rationale]

Then stop and wait for the project owner to re-verify before any Phase 1 work begins.
