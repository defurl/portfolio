# CONTEXT.md

## The developer

Working primarily in **AI / ML / quant / fintech**. Wants the portfolio to read as a credible signal to recruiters and collaborators in that space — not as a generic "frontend dev portfolio." Other dimensions of personality the site should carry without shouting:

- **Tech-deep**: comfortable with systems, models, infra. The portfolio itself should be a flex of that.
- **Music + ambient**: lo-fi, chill, atmospheric — the site should *feel* like the kind of music they listen to while working.
- **Minecraft enthusiast**: voxel grammar is in the vocabulary, but used with taste — as architecture, not as costume.

The portfolio is being built in an environment where AI-generated portfolios are the new baseline. The differentiation goal: produce something that an AI *visibly cannot generate end-to-end* — because the metaphor is too specific, the craft is too tactile, and the systems behind it (live market data, procedural audio, real ML visualization) require genuine engineering taste.

## The thesis

> A late-night quant's workstation, overlooking a voxel city that breathes with the market — and a doorway from the desk into the inside of a neural network.

This single sentence is the north star. Every scene, every interaction, every line of copy should be defensibly serving it.

## Why this concept (and not the obvious ones)

- **Not a Windows/Mac OS desktop portfolio**: done. The cinematic-night-desk variant we're building is adjacent but reframes the metaphor — it's not pretending to be an OS, it's a specific place, at a specific time, with a specific mood.
- **Not a Bruno-Simon-style driving game**: doesn't match the vibe. We want chill, not chaotic.
- **Not a generic 3D scrolly site**: we want layers the user *enters*, not parallax decoration.

The chosen concept earns its complexity by saying three things at once: "I do quant work," "I have taste," and "I can build hard things."

## The three layers, in detail

### Layer 1 — The Night Desk *(landing scene, ~70% of first-impression weight)*

A first-person view of a dimly-lit desk at 3am. Lo-fi plays at low volume. Rain texture on a single window pane to the right. The desk holds:

- A primary monitor — currently showing a chart with live data
- A secondary monitor — terminal with rolling logs that are real (deploys, model training, commits)
- A mechanical keyboard, a half-full coffee, a small plant, headphones
- A notebook with hand-drawn diagrams
- A phone face-down

Each object is a navigation anchor. Hover surfaces a small glow + a one-word label. Click zooms the camera in and reveals content:

- **Monitor 1** → projects (quant/ML work)
- **Terminal** → live activity / about / writing
- **Notebook** → research, sketches, longer-form writing
- **Headphones** → toggles the sonification audio
- **Phone** → contact (face it up to reveal)
- **Window** → transitions to Layer 2 (the voxel city)
- **Door (just out of frame, hint with light)** → transitions to Layer 3 (the NN)

The window is the most important element — it sells the world. Through it, the voxel city is visible at all times, breathing with the market.

### Layer 2 — The Voxel City

The view from the desk window, expanded. The user has "stepped to the window" or "passed through it" — a camera glide that takes ~2-3s.

Each building is a voxel structure whose state is driven by **live market data**:

- **Building height** = company market cap (or sector aggregate)
- **Window-light density** = current trading volume
- **Vertical light pulse rate** = volatility
- **Building color tint** = today's price change (green up, amber neutral, red down — muted, not garish)
- **Distant skyline glow** = overall index direction
- **Traffic streams between districts** = capital flows / sector rotation
- **Sky color and star density** = time of day in NY market hours (literally — pre-market, open, lunch, close, after-hours)

Layered audio:
- A slow ambient pad whose key shifts with the day's index direction
- A bassline whose tempo tracks the VIX
- Soft percussive ticks on individual trades or significant events
- The whole mix can be muted via the desk's headphones object

Navigation: the user can fly slowly over the city (with prefers-reduced-motion respected — no aggressive camera moves). Districts correspond to project categories (e.g., the "research district," the "trading district," the "infrastructure district").

### Layer 3 — Inside the Neural Network

The deep dive. Reached via the "door" hint on the desk scene, or by clicking a specific building in the city.

The user walks through an architecturally rendered transformer or deep MLP — long halls of attention heads, neurons as wall-embedded lights, token paths as glowing streams flowing through the space. The aesthetic shifts here from "voxel night city" to "abstract architectural" — colder, more geometric, more reverent. Less Minecraft, more Tadao Ando.

Each project gets a "chamber" — a side room where a single neuron fires when entered, surfacing:
- Project title and one-line thesis
- Technical writeup (markdown)
- Repo / paper / demo links
- A small live element if the project supports it (e.g., a tiny inference demo)

The ambient audio shifts to a sparser, more reverent palette — long sustained tones, less rhythmic.

## Target audience

In order of priority:

1. **Hiring managers and recruiters at quant firms, AI labs, and fintech**: need to see signal of seriousness and skill in ≤30s
2. **Fellow engineers and researchers**: who will spend longer and reward depth, easter eggs, and craft
3. **Designers and creative technologists**: who will share it if it's good enough
4. **Generalist tech audience (HN/Twitter)**: the viral-first-impression vector

The site needs to deliver something to each tier within roughly the first 10s, 1min, and 10min of attention respectively.

## Constraints (decided)

- **MVP scope**: ship all three layers. We are not staging.
- **Market data**: live, via free API (Finnhub primary, Alpha Vantage fallback). Must degrade gracefully off-hours.
- **Hosting**: Vercel.
- **Budget**: zero infra cost ideally; <$10/mo if forced.
- **Maintenance**: should not require attention more than once a quarter to stay alive.

## Brand voice

- **Confident but quiet.** No exclamation marks. No "Hi, I'm X!" greetings. The work and the world do the talking.
- **Specific over impressive.** "Built a market-making bot that traded $XM in volume on testnet" beats "passionate about algorithmic trading."
- **First-person, sparing.** "I" appears, but rarely. The site is a place, not a monologue.
- **Lowercase is fine for atmosphere, but copy is grammatical.** No twee or ironic-misspelling. Treat readers as smart.

## What we are explicitly NOT building

- A blog CMS (writing lives as markdown files in `content/`)
- A contact form (mailto link or a single click-to-reveal email)
- Account / login of any kind
- Comments, reactions, view counters visible to visitors
- A "skills" section with bars or percentages
- A "testimonials" section
- Any cookie banner unless legally required (no tracking → ideally no banner)
- A "fun facts about me" section
- A photo of the developer (the world is the avatar)

## The single test for any new decision

> Does this make the site more specifically *this developer's*, or could it appear on any other portfolio?

If the answer is "could appear on any other portfolio," we don't ship it.
