# 00 — Vision

> **Source of truth for "why."** Synthesized from `CONTEXT.md` and `design-spec.jsonc`. If a later doc disagrees with this, update both — don't let drift accumulate silently.

## One sentence

A late-night quant's workstation, overlooking a voxel city that breathes with the market — and a doorway from the desk into the inside of a neural network.

## The problem this portfolio solves

AI-generated portfolios are now the baseline. A clean Next.js + Tailwind + "Hi, I'm X" site no longer signals competence; it signals a prompt. For an engineer working in AI/ML/quant/fintech, the only credible signal left is **a portfolio that an AI visibly cannot generate end-to-end** — because the metaphor is too specific, the craft is too tactile, and the systems behind it (live market data, procedural audio, real ML visualization) require genuine engineering taste.

This site is the proof.

## What it is

A three-layer 3D experience, not a document:

1. **The Night Desk** — first-person, 3am, lo-fi, rain on the window. The desk's objects are the navigation. The window shows the city below; the door (just out of frame) hints at the neural net beyond.
2. **The Voxel City** — what's outside the window, expanded. Buildings sized and lit by live market data. A sonified soundscape that's literally generated from the feed.
3. **Inside the Neural Network** — an architecturally rendered transformer/MLP. Long halls of attention heads, neurons as wall lights, projects in side chambers.

Each layer is **entered**, not scrolled-past.

## What it is not

- Not a resume site. Not a "skills" page with bars.
- Not a Bruno-Simon driving game. We want chill, not chaos.
- Not a generic OS-desktop portfolio — the desk is a *place at 3am*, not a Finder window.
- Not a blog CMS. Writing is markdown in `content/`.
- Not a contact form. A click-to-reveal email is enough.
- Not a photo-of-me page. The world is the avatar.

## Target audience, in priority order

| Tier | Who | Attention budget | What they need within that budget |
|---|---|---|---|
| 1 | Hiring managers at quant firms, AI labs, fintech | ~30s | Signal of seriousness, taste, and shipping ability |
| 2 | Engineers / researchers | 1–10min | Depth, easter eggs, real projects with real artifacts |
| 3 | Designers / creative technologists | 1–5min | A reason to share it |
| 4 | Generalist tech (HN/Twitter) | ~10s in the timeline | A screenshot that travels |

The site must deliver something to each tier in its respective window.

## Brand voice

- **Confident, quiet.** No exclamation marks. No greetings. The work and the world do the talking.
- **Specific over impressive.** Numbers, volumes, model sizes — not adjectives.
- **First-person, sparing.** "I" exists, but rarely.
- **Lowercase is allowed for atmosphere; copy is grammatical.** No ironic misspellings.

## Aesthetic non-negotiables

(See `design-spec.jsonc` for the full contract; the headline rules:)

- Dark mode only. No light mode toggle ever.
- Amber is the soul color. Cyan is the city. Green/red are reserved for live data — never for UI states.
- Fraunces (display, italic), Geist (body), Departure Mono (terminal/data). **No Inter. No Roboto. No system-ui.**
- Slow motion. 600–900ms UI eases, 1.5–3s camera glides. Sub-second motion is reserved for live data events.
- Audio is opt-in, period. Toggle is the most prominent UI element on first paint.
- No glass-morphism, no purple gradients, no skill bars, no cookie banners.

## The single test for any new decision

> Does this make the site more specifically *this developer's*, or could it appear on any other portfolio?

If the answer is "could appear on any other portfolio," it doesn't ship.

## What "done" looks like for v1

- All three layers navigable on desktop (≥1024px) and mobile (≥375px, reduced fidelity).
- Live market feed wired, with offline replay proven end-to-end.
- Sonification active and tasteful (still pleasant at the 30-second mark).
- Lighthouse perf ≥ 85 on the landing route. 60fps on a 2021 MacBook Air.
- Real project content (not Lorem Ipsum) in `content/projects.json`.
- Keyboard-navigable critical paths; `prefers-reduced-motion` respected; `/text` fallback route for screen readers and no-WebGL clients.

## Risks worth naming up front

1. **Vibe drift under performance pressure.** The fix isn't to soften the aesthetic — it's to find a different optimization.
2. **Sonification becoming annoying.** Mitigation: it's off by default, and we test the 30-second-listen explicitly.
3. **Live-data fragility.** Mitigation: cached replay must work end-to-end before launch; rate-limit and outage paths exercised in dev.
4. **Mobile fidelity collapse.** Mitigation: explicit reduced-fidelity variant per scene, not a "hide the 3D" cop-out.
5. **Scope creep into a fourth layer.** Guard: any new layer requires explicit re-approval.

## North-star sentence (paste at the top of any spec)

> A late-night quant's workstation, overlooking a voxel city that breathes with the market — and a doorway from the desk into the inside of a neural network.
