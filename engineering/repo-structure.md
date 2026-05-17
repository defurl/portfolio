# engineering/repo-structure.md

> The file/folder shape, ownership rules, and naming conventions. Mirrors `docs/03-architecture.md` §2 and adds the conventions a tool (or a person opening the repo cold) needs.

## Top-level

```
/
├── public/                    # static, served as-is
│   ├── models/                # GLB/KTX2 assets (Git LFS if >1MB)
│   ├── audio/                 # OGG/MP3 samples + loops
│   ├── replay/                # cached market datasets (JSON)
│   ├── fonts/                 # self-hosted font files (woff2)
│   └── og.png
├── content/                   # version-controlled prose / data
│   ├── about.md
│   ├── projects.json
│   ├── projects/              # one .md per project
│   ├── writing/               # longform .md
│   └── symbols.json           # symbol → district/building mapping
├── src/
│   ├── main.tsx               # entry point
│   ├── App.tsx                # router shell
│   ├── routes/                # one component per route, lazy where noted
│   ├── scenes/                # 3D scene roots and their parts
│   │   ├── desk/
│   │   ├── city/
│   │   └── nn/
│   ├── overlay/               # DOM-side panels, HUD
│   ├── audio/                 # Tone.js engine + scene modules
│   ├── lib/
│   │   ├── data/              # market-data adapters + orchestrator
│   │   ├── stores/            # Zustand stores
│   │   ├── content/           # build-time content loader
│   │   └── motion/            # reduced-motion helpers
│   ├── shaders/               # .glsl, imported via vite-plugin-glsl
│   └── styles/                # tokens.css, globals.css
├── api/
│   └── feed.ts                # Vercel edge function
├── docs/                      # vision, SRS, PRD, architecture, roadmap
├── engineering/               # this file, data-sources, release checklist
├── .github/workflows/         # CI
├── design-spec.jsonc          # aesthetic contract (read-only at runtime)
├── CONTEXT.md
├── CLAUDE.md
├── worklog.md
└── package.json
```

## Naming conventions

| Kind | Pattern | Example |
|---|---|---|
| Component file | PascalCase | `DeskScene.tsx`, `ProjectPanel.tsx` |
| Hook | `useFoo.ts` | `useReducedMotion.ts` |
| Zustand store | `fooStore.ts` | `marketStore.ts` |
| Type-only file | `types.ts` (per folder) | `lib/data/types.ts` |
| Shader | kebab-case `.glsl` | `window-rain.glsl` |
| Content file | kebab-case | `content/projects/vol-arb-bot.md` |
| Test (when needed) | `Foo.test.ts` next to source | `orchestrator.test.ts` |

## Module ownership rules

- **`src/scenes/`** owns rendering only. It *reads* stores; it never writes content or fetches data.
- **`src/lib/data/`** owns network, parsing, normalization. It never touches React or R3F.
- **`src/lib/stores/`** is the only place mutable global state lives. Components never store global state in `useState`.
- **`src/overlay/`** is pure DOM. No `@react-three/fiber` imports here.
- **`src/audio/`** is the only place that touches Tone.js or Web Audio. Components dispatch via `audioStore`, not by importing the engine.
- **`api/`** runs on Vercel Edge runtime — no Node-only APIs, no large deps.

## Import hygiene

- No barrel exports (`index.ts` re-export files) — they defeat tree-shaking.
- Three.js access: prefer `@react-three/drei` abstractions. If raw `three` is needed, import the specific class (`import { Vector3 } from 'three'`), never the whole namespace.
- No deep imports across scene boundaries. `scenes/desk/*` does not import from `scenes/city/*`.
- The `/text` route's import graph must not transitively pull `@react-three/fiber` (enforced by a bundle check in CI later).

## TypeScript conventions

- `strict: true`. No `any` without `// reason: …` comment on the same line.
- Type-only imports: `import type { Foo } from '…'`.
- Discriminated unions for state machines (e.g., `FeedStatus = 'live' | 'rest' | 'replay' | 'error'`).
- Prefer `readonly` for shared store types.

## CSS conventions

- Tokens live in `src/styles/tokens.css` as CSS variables, generated from `design-spec.jsonc`.
- No CSS-in-JS. Plain CSS modules (`*.module.css`) for component-scoped styles; `globals.css` for resets and the body.
- No Tailwind. (If we ever add it, only with explicit user sign-off per CLAUDE.md.)
- ESLint rule bans hex literals that match the design-spec anti-patterns (purple, indigo, pure white).

## Asset conventions

- 3D models: `.glb`, Draco-compressed, KTX2 textures where supported.
- Audio: `.ogg` primary, `.mp3` Safari fallback. Stored at low gain headroom (−6dB peak).
- Texture atlases preferred over per-object textures.
- **LFS:** auto-tracked extensions are `.glb`, `.gltf`, `.ktx2`, `.ogg`, `.mp3`, `.wav`, `.woff2`. Raster images (PNG/JPG) are **not** auto-LFS — that complicates free-tier Vercel deploys for icons and favicons. Prefer SVG for icons. Any raster image >1MB should be added to LFS by name via `git lfs track public/path/to/image.png`.

## Git conventions

- Trunk-based. Short-lived branches named `phase-N/scope` (e.g., `phase-1/desk-objects`).
- Conventional-ish commit prefixes encouraged but not enforced: `feat:`, `fix:`, `chore:`, `docs:`.
- Every PR-sized change appends to `worklog.md` in the same commit.
- LFS for binaries; `.gitattributes` configures it.

## What does NOT belong in the repo

- Secrets (use Vercel env vars).
- Generated bundles, `dist/`, `node_modules/` (gitignored).
- Stock 3D assets without explicit sign-off (per CLAUDE.md).
- Backup files, OS turds (`.DS_Store`, `Thumbs.db`) — gitignored.
- Anything in `content/` that hasn't been read aloud at least once (no Lorem Ipsum).
