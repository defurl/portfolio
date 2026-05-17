# CLAUDE.md

> **This file is the entry point for any Claude Code session in this repo. Read it before touching anything else.**

## What this project is

A 3D portfolio website for a quant / ML / AI engineer with side interests in ambient music and Minecraft. The portfolio is **not a traditional resume site**. It is a deliberately niche, atmospheric, three-layer experience designed to stand out in an AI-saturated web — see `CONTEXT.md` for the full thesis, and `design-spec.jsonc` for the aesthetic contract.

The three layers, shipped together as the v1 MVP:

1. **The Night Desk** — cinematic landing. A 3D quant's workstation at 3am, lo-fi playing softly, rain on the window. Beyond the window: a voxel city skyline at night. Objects on the desk are the navigation.
2. **The Voxel City** — the skyline, alive with sonified market data. Buildings pulse with real volatility, traffic moves with volume, the sky color tracks index performance. Audio is procedurally generated *from* the live market feed.
3. **Inside the Neural Network** — the deep dive. A walk-through, architecturally rendered transformer or deep net. Each neuron expands into a project detail. Ambient soundscape shifts with traversal.

## Tech stack (default — challenge if you have a strong reason)

- **Build**: Vite + TypeScript + React 18
- **3D**: React Three Fiber + drei + (rapier for physics only if a layer demands it)
- **Audio**: Tone.js for synthesis + procedural composition. Web Audio API directly for low-level analysis.
- **State**: Zustand (no Redux, no Context-as-state)
- **UI motion**: Motion (formerly Framer Motion) for DOM, R3F-native for 3D
- **Market data**: Finnhub WebSocket (free tier, real-time-ish) as primary; Alpha Vantage REST as fallback; **always** have a cached/replayed dataset for off-hours and rate-limit cases — see `engineering/data-sources.md` once it exists.
- **Hosting**: Vercel (preview deploys per branch)
- **Package manager**: pnpm

## Architecture principles

1. **The vibe is non-negotiable.** Every technical decision serves the late-night-quant-terminal-meets-voxel-city aesthetic defined in `design-spec.jsonc`. If a performance optimization breaks the mood, find a different optimization.
2. **Performance budget, hard.** 60fps on a 2021 MacBook Air. ≤200KB initial JS (excluding 3D assets). LCP ≤ 2.5s. Lazy-load each layer.
3. **Graceful degradation for data and audio.** Market closed? Replay yesterday. API failed? Synthetic feed. WebGL unavailable? Static fallback site with the same content. Audio blocked by browser? Visual rhythm continues silently.
4. **No generic AI aesthetic.** No Inter, no purple-on-white gradients, no glass-morphism cards, no "modern minimal SaaS" patterns. See `design-spec.jsonc` "anti-patterns" for the full list.
5. **Voxel is a grammar, not a gimmick.** The city is voxel because it earns it (Minecraft heritage, blocky data-as-architecture metaphor). The desk and NN walkthrough are not voxel.

## Repo conventions

- TypeScript strict mode, no `any` without a `// reason:` comment
- Component files: PascalCase. Hooks: `useFoo.ts`. Stores: `fooStore.ts`.
- Three.js objects: prefer drei abstractions over raw THREE imports
- Shaders live in `src/shaders/` as `.glsl` files imported via `vite-plugin-glsl`
- 3D assets in `public/models/`, audio in `public/audio/`. Both git-LFS if >1MB.
- Every PR-sized change appends an entry to `worklog.md`

## Definition of done — v1 MVP

- All three layers navigable on desktop (≥1024px) and mobile (≥375px, with reduced fidelity)
- Live market feed connected with offline fallback proven
- Audio sonification active and tasteful (does not become annoying after 30s)
- Lighthouse perf ≥ 85 on the landing route
- Real project content in place (not Lorem Ipsum) — see `content/projects.json`
- A11y: keyboard nav for all critical paths, prefers-reduced-motion respected, audio off by default with prominent toggle

## What to do before generating code

1. Read `CONTEXT.md` and `design-spec.jsonc` in full
2. If the docs we need don't exist yet, generate them in this order:
   - `docs/00-vision.md` (synthesize from CONTEXT.md)
   - `docs/01-srs.md` (functional + non-functional requirements)
   - `docs/02-prd.md` (priorities, MVP cut line)
   - `docs/03-architecture.md` (system diagram, data flow)
   - `docs/04-roadmap.md` (phases, milestones)
3. Then scaffold the repo per `engineering/repo-structure.md` (generate it if missing)
4. Then build

## What to ask the user before doing

- Any decision that adds a new third-party dependency
- Any deviation from the design-spec.jsonc palette or typography
- Any change to the three-layer concept itself
- Anything touching the market data API key / billing surface
- Before adding a fourth layer or major scene

## What NOT to do

- Do not use Tailwind's default purple/indigo. Use the project palette via CSS vars.
- Do not import full lodash, full three.js, or full d3 — tree-shake or use minimal subsets
- Do not add a CMS. Content lives in `content/` as JSON/MD, version-controlled.
- Do not add tracking, analytics, or session replay without asking
- Do not use stock 3D assets without explicit permission — the Minecraft-coded voxel city should feel hand-built
- Do not ship without the offline data fallback working end-to-end

## Worklog protocol

After every meaningful change, append to `worklog.md`:

```
## YYYY-MM-DD HH:MM
- Did: [one line]
- Why: [one line]
- Next: [one line, or "—"]
```

## Quick reference

- Creative vision and rationale → `CONTEXT.md`
- Aesthetic contract (colors, type, motion, scene comp) → `design-spec.jsonc`
- Requirements (functional + NFR) → `docs/01-srs.md` *(generate first)*
- Architecture and data flow → `docs/03-architecture.md` *(generate first)*
- Rolling decision log → `worklog.md`
