# Contributing

This is a private, solo-built repo. The rules below exist to keep the history disciplined as the project grows.

## The non-negotiable rule

**No `Co-Authored-by:` trailers in any commit message.** No AI-attribution lines of any kind. Plain commits only.

This is enforced by:

- A local `commit-msg` git hook (rejects before the commit is created).
- A CI step on every push and PR (rejects if the local hook was bypassed).

If a `Co-Authored-by:` line lands on `main`, history rewriting is required to remove it. Don't.

## Branch model

- `main` is protected. No direct pushes — PRs only, even for solo work.
- Feature branches off `main`. Naming:
  - `phase-N/<slug>` for phase work — e.g., `phase-1A/desk-objects`
  - `fix/<slug>` for bug fixes
  - `chore/<slug>` for tooling/config
- Merge strategy:
  - **Squash-and-merge** for PRs with >3 commits or messy histories.
  - **Rebase-and-merge** for tightly-scoped PRs with 1–3 well-crafted commits.
  - The owner picks per PR.

## Commit message format

Conventional Commits, enforced by commitlint:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`, `ci`, `build`, `revert`.

### Allowed scopes (soft enforcement — warn only)

`desk`, `city`, `nn`, `audio`, `data`, `content`, `overlay`, `style`, `motion`, `a11y`, `infra`, `ci`, `docs`, `deps`.

### Subject rules

- Lowercase. No trailing period.
- ≤72 characters total (including type, scope, colon, space).
- Imperative mood: "add", "fix", "tune" — never "added", "fixing".

### Examples

```
feat(desk): add lamp geometry and warm key light
feat(desk): wire monitor 1 emissive with amber tint
fix(audio): respect prefers-reduced-motion on first toggle
style(desk): tune key/fill/rim balance for monitor cluster
docs(srs): clarify FR-26 audio persistence semantics
chore(deps): bump @react-three/postprocessing
ci(lint): scope no-unknown-property to scene files
```

The commitlint config lives in `commitlint.config.cjs`.

## Commit-size discipline

Right-sized commits, not thousand-line dumps. A `pre-push` hook prints warnings (not blocks) on:

- Any single commit with >500 lines changed (added + deleted), or
- Any single commit with >15 files changed.

A **hard block** triggers on commits with >2000 lines. That's a runaway, not a feature.

The script lives at `scripts/check-commit-size.mjs` — runnable standalone:

```sh
node scripts/check-commit-size.mjs origin/main HEAD
```

## Local hooks

Installed automatically when you run `pnpm install` (via the `prepare` script which calls `husky`).

- `.husky/commit-msg` — rejects `Co-Authored-by:` trailers, then runs commitlint.
- `.husky/pre-commit` — runs `pnpm typecheck && pnpm lint && pnpm lint:colors`. Fast checks.
- `.husky/pre-push` — runs `scripts/check-commit-size.mjs`.

**Do not use `--no-verify` to bypass these.** If a hook is failing, fix the underlying issue.

## Running the full check suite locally

Before opening a PR:

```sh
pnpm typecheck && pnpm lint && pnpm lint:colors && pnpm build && pnpm bundle:check
```

## Branch protection — to configure in the GitHub UI

The owner needs to set these on `main` once:

- **Require a pull request before merging:** on. Approvals required: 1 (self-approval permitted for solo work).
- **Require status checks to pass before merging:** on. Required check: `build` (the `ci.yml` job).
- **Require conversation resolution before merging:** on.
- **Restrict who can push to matching branches:** owner only.
- **Allow force pushes:** off.
- **Allow deletions:** off.
- **Require linear history:** on (paired with the squash/rebase merge strategy above).

## The phase-status badge

A daily-refreshed `phase-status.json` at the repo root tracks which phase has unchecked items in `docs/04-roadmap.md`. The `README.md` badge reads it via shields.io's dynamic-JSON endpoint.

**Caveat:** the repo is private, so shields.io can't fetch `phase-status.json` for public viewers — the badge renders as "inaccessible" externally. That's fine; this is for the owner's own dashboard view. If we ever want a public-facing status indicator, expose `phase-status.json` via a Vercel API route after launch.

## Worklog discipline

- Phase milestones and review fixes get hand-written entries (the detailed, multi-line kind already in `worklog.md`).
- Day-to-day commits get auto-synced bullet entries via the `worklog-sync` workflow on every push to `main`.
- Both coexist; they're visually distinguishable by header (`— phase 1 fix A` vs `— auto-synced from git log`).
- Don't manually edit the `<!-- worklog-sync: lastCommitSha=… -->` marker at the top of `worklog.md`.
