# Phase 1 — The Night Desk

You completed Phase 0 + Phase 0.5. The scaffold is signed off. **Now you are building the cinematic landing scene that the entire project hinges on.** Phase 1's exit gate (from `docs/04-roadmap.md`): *"A stranger lands cold, clicks Monitor 1 within 10s, reads a real project, leaves convinced. Lighthouse ≥85."*

Phase 1 is divided into **three checkpoints**. You stop and wait for owner review at each one. Do not push past a checkpoint without confirmation, even if the next group looks straightforward.

---

## Substitutions before you start

The owner will fill these in before pasting:

- `defurl` — used by the Terminal panel for build-time commit fetching
- `amorelyn.work@gmail.com` — used by the Phone object's mailto reveal

If these are blank when you read this prompt, stop and ask. Do not invent placeholders.

---

## Operating rules

1. **Re-read `CLAUDE.md`, `CONTEXT.md`, and `design-spec.jsonc` first.** These are the source of truth.
2. **No new third-party dependencies** except the two explicitly allowed below (see 1.13 and 1.16). Anything else requires owner sign-off.
3. **Materials go through `src/lib/style/colors.ts`** (the mirror created in C4). No hex literals in scene files. The `lint-colors` CI step will fail builds that bypass this.
4. **Every `useFrame` consults `useReducedMotion`** (the pattern established in A3). Phase 1 will have many — don't break the rule once.
5. **All hand-built 3D is OK at this phase**, but it has to be tasteful. No stock assets. Voxel grammar is allowed in the city scene; the desk is *not* voxel — it's a real-feeling room.
6. **Append to `worklog.md` after every fix lands**, per the `CLAUDE.md` protocol.
7. **Stop at every checkpoint.** Each checkpoint ends with a `WAIT` block. Do not proceed past it without explicit owner approval in chat.

---

# Checkpoint A — Scene foundation + desk objects

> Goal: a rendered, lit, populated desk that the owner can look at and say "yes, this is the vibe" before any interaction logic is wired.

### 1.1 Camera + scene setup

Replace the current `DeskScene` placeholder with the real foundation:

- Camera position: first-person seated at desk, eyes at ~`y=1.15` (head height for someone sitting), looking slightly down at the desk surface. Position approximately `[0, 1.15, 1.8]`, looking at `[0, 0.8, 0]`. FOV 50° per the design-spec.
- The desk surface is centered at origin; objects sit on top of it.
- Window is to the *right* of the desk (positive X, behind the monitors).
- Door is *off-frame to the left* (negative X) — represented only by a soft warm light spill onto the floor, no door geometry in v1.
- No camera controls in Checkpoint A (no OrbitControls). The camera is fixed.

### 1.2 Lighting pass

The lighting carries the entire mood. Get this right before objects.

- **Key light** — warm desk lamp. PointLight at the lamp's position. Color `LAMP_WARM` (from `colors.ts`). Intensity tuned so the desk surface in the lamp's pool reads ~70% paper-tone, falling off to ~20% at the far edge.
- **Fill light** — cool monitor glow. Two PointLights, one per monitor screen position. Color `VOXEL_GLOW`, low intensity (~0.4 of key). These should *just* be visible on the keyboard and on the underside of objects facing the monitors.
- **Rim light** — cool window light. DirectionalLight from the window's direction. Color `VOXEL_GLOW_SOFT`. Low intensity (~0.15 of key). Provides the silhouette edge that separates objects from the dark background.
- **Ambient** — almost zero. Color `BG_NIGHT`, intensity ~0.04. The room is *dark*; objects should be defined by their key/fill/rim, not by ambient flood.

Acceptance test for lighting: take a screenshot. The lamp pool should be the brightest area. Monitors should glow but not dominate. Objects facing away from any light source should be readable but dim — not pure black, not lit.

### 1.3 Bloom pass

Add postprocessing via `@react-three/postprocessing`. **This is the one new dependency for Checkpoint A.** Configure two bloom passes (or one with selective intensity):

- Warm bloom on the lamp emissive material — luminance threshold tuned so only the lamp bulb itself blooms.
- Cool bloom on monitor screens — slightly tighter falloff, so the bloom hugs the screens rather than washing the desk.

Bloom **disabled** when `prefersReducedMotion` is true (pulsing/animating bloom triggers vestibular issues; static bloom is fine but cheap to skip).

Bloom **disabled** when adaptive FPS detects sustained <50fps for 2s (use drei's `useDetectGPU` or a simple `useFrame`-based rolling average). Lay the hooks for the perf-adaptive pattern now; Phase 3 will reuse it.

### 1.4 Film grain wiring

The `.grain` overlay already exists in `globals.css` and is applied at the App level. Verify:

- It's visible on `/` (not just on light backgrounds).
- It animates at ~24fps for film-coded subtle movement (currently it's static — add a CSS `@keyframes` that shifts the background-position by a few pixels on a 6s loop, only when reduced-motion is *off*).
- The opacity stays at 0.03 — no higher. Grain is atmosphere, not texture.

### 1.5 The desk surface

Replace the current `DeskSurface` placeholder:

- A real desktop plane (~1.8m × 0.9m), matte dark wood material — `BG_PANEL` base, roughness ~0.85, very low metalness.
- A subtle bevel on the front edge (use `boxGeometry` with thin height rather than a plane, so the edge catches the lamp rim).
- Slight grain texture on the wood — procedural noise in the shader, or a single low-res normal map. Optional but tasteful.

### 1.6 Desk objects — geometry pass

Build the eleven objects listed below. Use hand-built primitive composition (boxes, cylinders, beveled boxes via drei's `RoundedBox`) — **no GLB imports, no stock assets**. Each object should be recognizable in silhouette, not realistic.

Positions are suggestions; tune visually:

| Object | Approx position | Notes |
|---|---|---|
| Monitor 1 (primary) | `[-0.3, 0.55, -0.4]` | ~24" wide-equivalent, slight tilt, thin bezel, emissive screen with subtle gradient |
| Monitor 2 (terminal) | `[0.5, 0.55, -0.4]` | Smaller (~22"), portrait or landscape — owner's call; same emissive treatment but cooler/dimmer |
| Mech keyboard | `[0, 0.04, 0.2]` | TKL footprint, very low profile (PBT-coded), each keycap as a tiny rounded box; ~60 caps minimum |
| Coffee mug | `[0.55, 0.06, 0.35]` | Cylinder, slight tapered shape, dark color; steam optional (P2) |
| Small plant | `[-0.7, 0.12, 0.3]` | Pot (small cylinder) + 5-7 leaves as triangulated planes with subtle Y rotation each |
| Headphones | `[0.6, 0.05, 0.05]` | Resting flat on the desk — two earcups + a thin band. Recognizable in silhouette. |
| Notebook | `[-0.55, 0.025, 0.1]` | A4-ish closed book; spine on one edge; subtle paper texture |
| Phone | `[0.7, 0.012, -0.05]` | Face-down rectangle, ~150×75mm, very thin |
| Lamp | `[0.9, 0.35, -0.2]` | Articulated arm + cylindrical shade; emissive material on the bulb |
| Window frame | `[1.2, 1.0, -0.6]` (right of desk, behind monitors) | Tall vertical rectangle, dark frame, glass plane with rain shader (1.18 later) |
| Door light spill | Floor plane to camera-left | No geometry — just a soft warm directional light from off-screen left, hitting a small rectangle of floor |

For each object, **describe in a header comment** what it represents and what scale it's targeting. This is your aesthetic checklist.

### 1.7 Materials & emissive screens

- All non-emissive materials use `MeshStandardMaterial` with values from `colors.ts`.
- Monitor screens use `MeshBasicMaterial` with a subtle vertical gradient (top slightly brighter), or `MeshStandardMaterial` with high emissive. The Monitor 1 screen color references `SIGNAL_AMBER_DIM` (a hint of the project content's warm tone); Monitor 2 (terminal) is `VOXEL_GLOW_SOFT`.
- Add a faint specular highlight on the coffee mug, the phone, the headphones — these are the objects that should catch the lamp.
- The notebook, the desk surface, and the plant pot are matte.

### 1.8 Composition + check

Walk through the scene in your head as if it were a film still:

- Does the eye land first on the lamp pool? It should.
- Is Monitor 1 the second focal point? It should be — it's the projects entry point.
- Are the secondary objects (coffee, plant, headphones) readable in silhouette without competing?
- Does the window read as "out there is a city" even before we add the city render — i.e., is the rim light placed and colored such that the right edge of the scene feels colder and more distant?

### 1.9 Checkpoint A acceptance criteria

- `pnpm dev` shows the populated desk scene with the lighting pass and bloom.
- Toggling DevTools `prefers-reduced-motion: reduce` disables bloom and freezes grain animation; everything else stays visible.
- No hex literals in any scene file (`pnpm lint:colors` passes).
- `pnpm typecheck` and `pnpm lint` pass.
- The bundle-budget script still passes (entry chunk should not have grown — postprocessing lives in the DeskRoute lazy chunk).
- All eleven objects are present, in approximately their listed positions, recognizable in silhouette.

### 1.10 WAIT for Checkpoint A review

**STOP HERE.** Post in chat:

- Confirmation that all acceptance criteria pass.
- Three screenshots: (1) the full desk, (2) a close-up on Monitor 1 and the lamp pool, (3) the right edge with the window. Use `pnpm dev` and a manual screenshot — no automation required.
- The output of `pnpm bundle:check`.
- Any decisions you made that weren't specified above (positions, materials, geometry detail), one line each.

Do not proceed to Checkpoint B until the owner approves in chat.

---

# Checkpoint B — Interactions + panels

> Goal: every desk object is clickable and reveals content. The UX cadence (hover, click, panel slide, return) feels right.

### 1.11 Hover state

Each navigable object exposes a hover state:

- **Emissive lift**: the object's emissive intensity (or a thin outline shader, your choice) increases by ~20% on hover.
- **Label**: a Departure Mono one-word label appears, positioned just above the object in screen space. Use drei's `<Html>` for the label with `transform={false}` and `prepend` for a clean DOM overlay.
- **Cursor**: pointer cursor on hover.
- **Audio cue**: a very subtle tick (one-shot, ~0.02 gain) — *only* if audio is enabled. Use the `audioStore` to check.

The hover state respects `prefersReducedMotion` — emissive lift becomes instant rather than 180ms-eased, but it still appears.

Object → label mapping (Departure Mono, lowercase):
- Monitor 1 → `projects`
- Monitor 2 → `terminal`
- Notebook → `notebook`
- Headphones → `sound`
- Phone → `contact`
- Window → `city`
- Lamp, Mug, Plant, Keyboard → **not interactive in v1**, but should still receive subtle hover feedback (slight emissive lift, no label) so the room feels alive.
- Door light spill → `nn` (the only "off-canvas" interaction; hover the spill on the floor)

### 1.12 Click → camera zoom

Clicking a labeled object triggers a camera glide:

- Use drei's `<CameraControls>` or hand-rolled lerp. Hand-rolled is fine (and lighter); lerp camera position + lookAt target over `--dur-camera` (2200ms) with `--ease-camera` curve.
- The zoom target depends on the object — e.g., clicking Monitor 1 brings the camera close to its screen, framing it ~80% of viewport height.
- Camera glide **disabled** under reduced motion — instead, the panel slides in immediately with a 400ms crossfade and the camera doesn't move.
- A persistent **"back to desk"** affordance (Departure Mono, bottom-left, amber on hover) appears as soon as the camera has left its rest position. Clicking it reverses the glide.

### 1.13 Panel slide-in (DOM overlay)

Use plain CSS transitions for panel motion. **Do not introduce framer-motion or motion** — this resolves architecture-deferred decision D5 toward "CSS is enough."

- Panels slide in from the *right*, 480px wide, full viewport height.
- Background: `--bg-panel` with 0.85 opacity, backed by `backdrop-filter: blur(20px)`. (This is the *only* glass-morphism allowed in the project, and only because it's a side panel over a 3D scene where contrast matters. The design-spec anti-pattern rule against glass-morphism explicitly applies to *cards and feature boxes*, not transient panels — but add a comment in the panel CSS noting this exception so future drift is caught.)
- Border: 1px solid `--ink-ghost` on the left edge only.
- Padding: 2.5rem 2rem.
- Slide duration: `--dur-reveal` (900ms) with `--ease-ui`.
- A small "×" close button top-right of the panel (Departure Mono, mono `×`, amber on hover). Esc also closes.

### 1.14 The ProjectPanel

Driven by `content/projects.json` (the index) and on-demand markdown loading per project (per B3 lazy strategy).

- Top: section eyebrow ("projects"), Departure Mono, wide tracking, `--ink-faint`.
- A list of project entries. Each entry: title (Fraunces italic, step-3), one-line thesis (Geist, step-1-up, `--ink-muted`), spacing between.
- Click a project entry → loads the body markdown via `loadProjectBody(id)` and renders it in-place, replacing the list. A small "← back to list" Departure Mono link returns.
- For Checkpoint B, populate `content/projects.json` with **3 placeholder projects** that read as real (no Lorem Ipsum — write actual one-line theses about plausible quant/ML work; the owner will replace them in Phase 5). Place corresponding `.md` files in `content/projects/`.

### 1.15 The TerminalPanel

Real terminal-coded panel that shows recent activity.

- Header: `// {{GITHUB_USERNAME}} — last 7 days` in `--ink-faint` Departure Mono.
- Body: a list of recent commits fetched from the GitHub API **at build time** (not runtime — this matches FR-28 and avoids any client-side API key concerns).
- Use a Vite plugin or a pre-build script (`scripts/fetch-github-activity.mjs`) that hits `https://api.github.com/users/{{GITHUB_USERNAME}}/events/public`, filters to `PushEvent` and `PullRequestEvent` from the last 7 days, and writes a JSON file to `src/generated/github-activity.json` (gitignored). Import this JSON in the TerminalPanel.
- If the build script fails (rate limit, no network), it should write a fallback JSON with a single entry: `{ source: "stub", message: "activity unavailable at build time" }` — and the panel renders that gracefully.
- Each commit: timestamp (Departure Mono, `--ink-faint`), repo name (Departure Mono, `--ink-paper`), commit message (Geist, `--ink-muted`, truncated at 80 chars).
- A rolling-scroll animation on the panel content (slow, 20px / 4s) **when reduced motion is off**. Static list when reduced motion is on.
- Below the commit list: a quiet `about.md`-derived bio (~80 words).

### 1.16 The NotebookPanel

Renders `content/writing/*.md`.

- A list of writing pieces (title + date), Fraunces italic for titles.
- Click → opens the piece body in the same panel.
- For Checkpoint B, populate **2 placeholder writing pieces** that read as real. Don't worry about polish; they'll be replaced.

### 1.17 The Phone (contact)

- Click the (face-down) phone → small camera nudge + the phone "flips face-up" with a 700ms CSS-like 3D rotation in three-space.
- Screen content (drei `<Html>` again, or a flat texture): the email address `{{CONTACT_EMAIL}}`, styled as a tappable mailto link. Departure Mono, amber.
- A subtle "back to desk" affordance brings the phone face-down again.

### 1.18 Audio toggle (verify, don't rebuild)

The AudioToggle already exists from Phase 0. Verify in Checkpoint B:

- Still bottom-right per C2.
- Clicking it once is *the* user gesture that initializes the audio context for the session.
- For Checkpoint B, wire it to play **just a lo-fi loop at 0.3 gain** when enabled in the desk scene. Use a placeholder royalty-free track or a generated test loop (Tone.js can synthesize one — keep it simple, this gets replaced in P2).

### 1.19 Checkpoint B acceptance criteria

- Every interactive object hovers, clicks, and reveals its panel.
- Camera glides feel slow and cinematic (not snappy), and instant under reduced motion.
- The "back to desk" affordance is visible whenever the camera has left rest position, and not before.
- TerminalPanel shows real recent commits (or graceful stub if the build script failed).
- Esc closes any open panel.
- Audio toggle, when enabled, plays the lo-fi loop and persists across navigation within `/`.
- `pnpm typecheck` and `pnpm lint` pass.
- `pnpm bundle:check` passes (entry chunk should be under 80KB gzipped still; DeskRoute chunk may grow but stay reasonable).

### 1.20 WAIT for Checkpoint B review

**STOP HERE.** Post in chat:

- Confirmation that all acceptance criteria pass.
- A short screen recording (or 4-5 screenshots) showing: hover state on Monitor 1, click → ProjectPanel slides in, close → camera glides back, hover on Phone, click → face-up reveal.
- The output of `pnpm bundle:check`.
- A note on whether the `--dur-camera` (2200ms) feels right or wants tuning — owner reviews this subjectively.

Do not proceed to Checkpoint C until the owner approves in chat.

---

# Checkpoint C — Mobile reduced-fidelity variant

> Goal: the experience holds on a 375px viewport with a real reduced-fidelity variant — not a "hide the 3D" cop-out.

### 1.21 Mobile detection + scene variant

- Use a CSS media query + `useMediaQuery` hook to detect viewports ≤768px.
- On mobile: switch to an orthographic-ish camera (slightly raised, looking down at the desk from a 45° angle). FOV reduced, scene reframed so all objects are visible without scrolling.
- Disable bloom on mobile by default (perf budget).
- Disable the rolling-scroll terminal animation on mobile.
- Reduce instance count of small repeated elements (e.g., keyboard caps — collapse to fewer larger keys, or use a single textured plane).

### 1.22 Mobile interaction model

- Hover doesn't exist on touch — replace with tap-to-label, second-tap-to-activate.
- First tap on an object: label appears (Departure Mono floating above), a subtle highlight glow on the object. The label stays for ~3s.
- Second tap on the *same* object within those 3s: activates (same as click on desktop).
- Tap elsewhere: dismisses the label.
- Panels: full-screen instead of 480px slide-in. Same backdrop-blur, no border. Closes via a top-right × or swipe-down (use a simple pointer-event handler, no library).

### 1.23 Mobile audio toggle

- Move the toggle to the *top* of the screen (a thin bar at top-right) so it's reachable without competing with the bottom of the panel UI.
- Same OFF-by-default behavior.

### 1.24 Mobile typography

- Step down all sizes by one step on the type scale (step-3 → step-2, etc.).
- Tighter line-height for body (1.5 instead of 1.6).
- Increase touch targets to ≥44×44px (current Departure Mono labels may be too small).

### 1.25 Checkpoint C acceptance criteria

- Viewing `/` at 375px width shows the reduced-fidelity desk variant.
- All eleven objects are visible and tappable.
- Panels open full-screen and close via × or swipe-down.
- Audio toggle is at top-right and works.
- Lighthouse mobile perf ≥85, a11y ≥95 on `/` and `/text`.
- `pnpm typecheck`, `pnpm lint`, `pnpm bundle:check` all pass.
- 60s sustained on a mid-tier mobile target → ≥45fps (NFR-1).

### 1.26 WAIT for Checkpoint C review

**STOP HERE.** Phase 1 is complete pending owner approval. Post in chat:

- Confirmation that all acceptance criteria pass.
- Screenshots of the mobile variant at 375px width — at minimum: the desk scene, an open panel.
- Lighthouse mobile + desktop scores for `/` and `/text` (run `pnpm lh:check` locally).
- Any decisions made along the way that the owner should know about.

---

## Final summary (post when Checkpoint C is signed off)

When Phase 1 is fully approved, summarize in this format:

- **Checkpoint A:** done [date]
- **Checkpoint B:** done [date]
- **Checkpoint C:** done [date]
- **New deps added:** `@react-three/postprocessing` (justified in 1.3)
- **Decisions made not explicitly specified:** [list]
- **Open TODOs for Phase 2:** [list]
- **Outstanding owner actions:** [e.g., final OG image, Vercel domain, etc.]

Then update `04-roadmap.md`: check off Phase 1, set Phase 2 as the active phase, and append a Phase 1 summary entry to `worklog.md`.
