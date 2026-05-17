# 02 — Product Requirements Document

> Turns the SRS into a prioritized shipping plan. The MVP cut line is **explicit and defended** here. If you find yourself building something not on this list, stop.

## 1. Goals

| # | Goal | Success measure |
|---|---|---|
| G1 | Land a first-time visitor in a world they want to stay in | Scroll-depth proxy: 60%+ of sessions interact with ≥1 desk object |
| G2 | Surface project signal to a recruiter in ≤30s | Monitor 1 → projects index loads <1s after click |
| G3 | Stand apart from generic AI-generated portfolios | Qualitative: 3+ shares from non-network designers/engineers within 30 days of launch |
| G4 | Stay alive with zero maintenance | No infra cost; data fallback proven; deploy hands-off |

## 2. User stories (prioritized)

Priority bands: **P0** ship-blocker · **P1** required for v1 launch · **P2** nice-to-have, slip OK · **P3** post-v1.

### P0 — without these, no launch

- **U1.** As a visitor, when I land on `/`, I see the Night Desk scene with ambient motion within 2.5s of LCP.
- **U2.** As a visitor, I can click each desk object and see its associated panel with real content.
- **U3.** As a visitor on the desk, I can see the voxel city through the window with at least basic market-driven motion (height + color tint).
- **U4.** As a visitor, I can enter the city by clicking the window and return to the desk.
- **U5.** As a visitor, I can enter the NN walkthrough via the door and walk through it; at least 3 project chambers are populated.
- **U6.** As a visitor with `prefers-reduced-motion`, all camera glides become crossfades and ambient motion freezes.
- **U7.** As a screen-reader user (or anyone hitting `/text`), I can read all project, writing, and contact content.
- **U8.** As a visitor with the market closed or feed failed, I see the city continue to live via cached replay.
- **U9.** As a visitor, audio is off when I land; the toggle is unmistakable.
- **U10.** As a visitor on mobile (375px), I see a reduced-fidelity version of all three layers and can navigate them.

### P1 — required for v1 quality

- **U11.** As a visitor, audio (when enabled) is layered per the sonification spec and is still pleasant at the 30s mark.
- **U12.** As a visitor, building → district → project mapping is legible (a quiet legend somewhere or hover-revealed).
- **U13.** As a visitor, I can deep-link directly to `/city` or `/nn` and a graceful fade-in plays.
- **U14.** As an engineer-visitor, the terminal panel shows real activity (recent commits/deploys) rather than fake logs.
- **U15.** As a recruiter-visitor, every project chamber links to a repo, paper, or live demo.
- **U16.** As a visitor on a no-WebGL browser, I'm redirected (or one-click banner-prompted) to `/text`.
- **U17.** Lighthouse Perf ≥85 / a11y ≥95 on `/` and `/text`.

### P2 — slip OK

- **U18.** As a visitor, hovering a city building reveals a Departure-Mono callout with the symbol + live price.
- **U19.** As a visitor, the lo-fi loop is a custom-composed piece, not a third-party royalty-free track.
- **U20.** As a visitor, the NN walkthrough features a "high-fidelity" opt-in toggle (more neurons, bloom).
- **U21.** As a visitor, the phone object reveals an animated business-card flip.
- **U22.** As a visitor, district signs animate in Departure Mono when zooming.
- **U23.** As a visitor, the city's traffic streams animate (P1 has color/height only).

### P3 — post-v1

- **U24.** A small live inference demo embedded in one NN chamber (e.g., a tiny transformer attention viz on real input).
- **U25.** Easter egg(s) — TBD; must pass the "specifically this developer's" test.
- **U26.** Custom WebGL shader for rain on glass (v1 uses a texture).
- **U27.** Mobile: gyro-driven parallax on the desk scene.
- **U28.** A `/sound` route that lets you mix the city's sonification layers manually.

## 3. MVP cut line

**In v1:** every P0 + every P1.
**Slips OK:** P2 ships if we don't burn the timeline.
**Explicit no:** P3, plus everything in SRS §8.

The hardest cut to honor: **we ship all three layers or we don't launch.** Two-layer launches break the thesis. If a layer slips, the launch slips.

## 4. Content readiness gate

Launch requires:

- ≥6 real projects with markdown writeups, repo/paper links, district assignment
- An `about.md` of ≤200 words
- ≥2 longform writing pieces (or "writing" room is hidden in v1)
- A confirmed contact email
- An OG image that's a true render of the desk, not a stock shot

If content is not ready, **the launch slips** before the launch ships with Lorem Ipsum.

## 5. Quality bars (verify before shipping)

- 60fps on a 2021 MacBook Air, all three scenes, sustained 60s.
- The 30-second audio test: enable audio, walk away for 30s, return — is it still pleasant?
- The 30-second visitor test: a stranger lands on the site cold. In 30s, can they name what kind of work this person does?
- The disconnect test: pull the network mid-session. Does the city keep breathing via replay?
- The keyboard test: tab through every critical path with the mouse unplugged.

## 6. Tradeoff defaults

- **Vibe wins over performance** when they conflict — but only after the performance budget is exhausted via other optimizations.
- **Live data fidelity wins over realism** — if the data is wrong, the city is a lie. Replays are correct, snapshotted data; never synthetic-when-we-could-be-real.
- **Less wins over more** — when in doubt, cut. The site is *quiet*. Every added element must defend itself.

## 7. Open questions (resolve before/during build, not after)

| # | Question | Owner | Resolve by |
|---|---|---|---|
| Q1 | Transformer vs MLP for the NN walkthrough geometry | dev | end of architecture phase |
| Q2 | District list — which categories, how many | dev | before content lock |
| Q3 | Lo-fi: custom-composed or licensed track | dev | before audio milestone |
| Q4 | Whether `/text` is a hidden route or surfaced from `/` | dev | before a11y pass |
| Q5 | OG image: still render or short MP4 preview where supported | dev | before launch checklist |
| Q6 | Finnhub free-tier WebSocket subscription practicality (symbol cap, connection limits, abuse policy on direct-from-browser) | dev | Phase 2 |
| Q7 | Whether the secondary desk-window city canvas can sustain 50fps on a 2021 MBA; if not, define the static-fallback condition | dev | Phase 3 |

## 8. Definition of v1 launch ✅

- [ ] All P0 and P1 user stories pass acceptance.
- [ ] Content gate (§4) met.
- [ ] Quality bars (§5) verified.
- [ ] `worklog.md` reflects the build.
- [ ] Deployed to Vercel with custom domain, HTTPS, OG/Twitter cards verified via debuggers.
- [ ] At least one external person has done the 30-second test and the 5-minute test without intervention.
