# Phase 0.6 — GitHub workflow scaffolding

You completed Phase 0.5. Before Phase 1 begins, set up the repo workflow infrastructure so the work history stays clean and disciplined.

The repo is **private**. Commit-author messages must **never** include `Co-Authored-by: Claude` or any equivalent attribution line. Plain commits only.

## Operating rules

1. **Re-read `CLAUDE.md`, `CONTEXT.md`, `design-spec.jsonc` first.**
2. **No new third-party dependencies** beyond what's listed in the pieces below (`husky`, `@commitlint/cli`, `@commitlint/config-conventional`).
3. **Append to `worklog.md` after each piece lands**, per the `CLAUDE.md` protocol.
4. **Stop when all five pieces are applied and the verification block passes.** Do not begin Phase 1.

---

## The five pieces

### Piece 1 — Conventional Commits + commitlint

Lightweight conventional-commits format, enforced locally via a pre-commit hook.

**Format:**

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Allowed types** (commitlint config):

- `feat` — a user-visible feature or capability
- `fix` — a bug fix
- `docs` — docs only (markdown, comments)
- `style` — formatting, palette, typography, motion (no logic change)
- `refactor` — code restructure with no behavior change
- `perf` — performance improvement
- `chore` — tooling, deps, configs, CI
- `ci` — CI workflow changes only
- `build` — build system, Vite, bundler config
- `revert` — revert a prior commit

**Allowed scopes** (commitlint config — list, but not strict):

- `desk`, `city`, `nn` — scene scopes
- `audio`, `data`, `content`, `overlay`, `style`, `motion`, `a11y`
- `infra`, `ci`, `docs`, `deps`

**Subject rules:**

- Lowercase, no trailing period.
- ≤72 characters total subject line (type + scope + colon + subject).
- Imperative mood ("add", "fix", "tune" — not "added", "fixing").

**Examples** (these become the golden samples in `CONTRIBUTING.md`):

```
feat(desk): add lamp geometry and warm key light
feat(desk): wire monitor 1 emissive with amber tint
fix(audio): respect prefers-reduced-motion on first toggle
style(desk): tune key/fill/rim balance for monitor cluster
docs(srs): clarify FR-26 audio persistence semantics
chore(deps): bump @react-three/postprocessing
ci(lint): scope no-unknown-property to scene files
```

**Implementation:**

- Add to `package.json` devDependencies: `@commitlint/cli`, `@commitlint/config-conventional`, `husky`.
- Create `commitlint.config.cjs`:
  ```js
  module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [2, 'always', [
        'feat','fix','docs','style','refactor','perf','chore','ci','build','revert'
      ]],
      'scope-enum': [1, 'always', [
        'desk','city','nn','audio','data','content','overlay',
        'style','motion','a11y','infra','ci','docs','deps'
      ]],
      'subject-case': [2, 'always', 'lower-case'],
      'subject-full-stop': [2, 'never', '.'],
      'header-max-length': [2, 'always', 72],
    },
  };
  ```
- Add `prepare` script to `package.json`: `"prepare": "husky"`.
- Run `pnpm exec husky init` once (creates `.husky/` and `pre-commit`).
- Configure two hooks:
  - `.husky/commit-msg` — runs `pnpm exec commitlint --edit $1`. Blocks commits whose message doesn't match the convention.
  - `.husky/pre-commit` — runs `pnpm typecheck && pnpm lint && pnpm lint:colors`. Fast checks only — no build, no Lighthouse.
- The pre-commit hook should be **fast** (target <10s on the current scaffold). If it exceeds that, drop `typecheck` from the hook and rely on CI for it.

### Piece 2 — No-coauthor enforcement

**This is non-negotiable.** No commit message in this repo's history may contain `Co-Authored-by:` or any AI-attribution trailer.

- Add `.husky/commit-msg` validation **before** the commitlint call: grep the commit message file for any line matching `^Co-Authored-by:` (case-insensitive). If found, exit 1 with a clear error: `commit rejected: Co-Authored-by trailer not allowed in this repo. See CONTRIBUTING.md.`
- Add the rule to `CONTRIBUTING.md` (see Piece 5).
- Add a CI-side guard too (in case the hook is bypassed): a new step in `.github/workflows/ci.yml` after checkout that runs:
  ```bash
  if git log --format='%B' origin/main..HEAD | grep -i '^Co-Authored-by:'; then
    echo "::error::Co-Authored-by trailer is not allowed in this repo."
    exit 1
  fi
  ```
  This catches anything that slipped past the hook.

### Piece 3 — Commit-size discipline

The owner asked for incremental, decent-sized commits — feature-sized or mini-feature-sized, not thousand-line dumps.

This can't be hard-enforced (good commits are a craft, not a rule), but make it visible and slightly friction-y:

- Add a **pre-push hook** at `.husky/pre-push` that runs `scripts/check-commit-size.mjs`. The script computes the diff stats for commits being pushed to `main` (or any branch if not on `main`) and **warns** (not blocks) if any single commit has:
  - >500 lines changed (added + deleted), OR
  - >15 files changed
  - The warning prints the commit hash + subject + stats and a one-line nudge: `consider splitting this commit; see CONTRIBUTING.md`.
- The script does NOT block the push — over-strict size limits push people to bad workarounds like `--no-verify`. The warning is enough; the owner can decide whether to split.
- **Hard block** (exit 1) only on commits with >2000 lines changed. That's a runaway, not a feature.

The script lives at `scripts/check-commit-size.mjs` and uses `git log --numstat`.

### Piece 4 — `worklog-sync` GitHub Action

A workflow that keeps `worklog.md` in sync with the git log without manual effort.

- File: `.github/workflows/worklog-sync.yml`.
- Trigger: on every push to `main`.
- Permissions: `contents: write` (to commit the updated worklog back).
- Behavior:
  1. Checkout the repo.
  2. Run `scripts/sync-worklog.mjs`.
  3. If the script modified `worklog.md`, commit and push the change with message: `docs(worklog): sync from git log [skip ci]`. The `[skip ci]` prevents recursion.

**The `scripts/sync-worklog.mjs` logic:**

- Read `worklog.md`.
- Find the most recent entry. Each entry is delimited by `## YYYY-MM-DD HH:MM —` headers.
- Extract the "last synced commit SHA" from a hidden HTML comment at the top of the file (e.g., `<!-- worklog-sync: lastCommitSha=abc1234 -->`). If absent, default to the SHA of the worklog's most recent commit.
- Get all commits since that SHA via `git log --since-sha --pretty=format:'%H|%s|%b|%ai'`.
- Filter out commits whose subject starts with `docs(worklog):` (don't sync ourselves).
- Group commits by their date (UTC).
- For each new date group, append an entry to `worklog.md` with this shape:
  ```
  ## YYYY-MM-DD — auto-synced from git log
  - feat(desk): add lamp geometry and warm key light (`abc1234`)
  - feat(desk): wire monitor 1 emissive with amber tint (`def5678`)
  - style(desk): tune key/fill/rim balance (`9abcdef`)
  ```
- Update the hidden `lastCommitSha` comment at the top.
- If no new commits to sync, exit 0 without writing.

This way:

- The manual Phase-X verification entries written by Claude Code stay as authored, detailed paragraphs.
- The day-to-day commit history shows up as auto-synced bullet entries.
- Both coexist in `worklog.md` without conflict — they're visually distinguishable by header style (`— phase 0.5 fix A1` vs `— auto-synced from git log`).

### Piece 5 — `CONTRIBUTING.md` + branch protection + phase-status badge

**`CONTRIBUTING.md`** at repo root, ≤200 lines. Covers:

- Branch model: `main` is protected. All work in feature branches off `main`. PRs only — no direct pushes to `main`, even for solo work.
- Branch naming: `phase-N/short-slug` for phase work (e.g., `phase-1A/desk-objects`), `fix/short-slug` for bugfixes, `chore/short-slug` for tooling.
- Merge strategy: **squash-and-merge** for PRs that span >3 commits; rebase-and-merge for tightly-scoped PRs with 1–3 well-crafted commits. The owner picks per PR.
- Commit message format (link to commitlint config).
- The Co-Authored-by rule, called out explicitly and at the top.
- The pre-commit / pre-push hooks and what they check.
- How to run the local checks manually: `pnpm typecheck && pnpm lint && pnpm lint:colors && pnpm build && pnpm bundle:check`.

**Branch protection on `main`** — describe in `CONTRIBUTING.md` (the owner will configure via GitHub UI; the doc tells them what to set):

- Require pull request before merging (1 approval — owner self-approves on solo work).
- Require status checks to pass: `ci` workflow, all jobs.
- Require conversation resolution before merging.
- Restrict who can push to matching branches: only the owner.
- Do not allow force pushes. Do not allow deletions.

**Phase-status badge** — a small ambient signal in `README.md`:

- A new file `phase-status.json` at repo root (gitignored from manual edits — written by the action below).
- A new workflow `.github/workflows/phase-status.yml`:
  - Trigger: on push to `main`, and once daily on a cron.
  - Reads `docs/04-roadmap.md`, finds the first phase whose checkboxes are NOT all `[x]`.
  - Writes `{ phase: "Phase 1", checkpoint: "A", updatedAt: "..." }` to `phase-status.json`.
  - Commits the change with `chore(ci): refresh phase status [skip ci]`.
- A badge in `README.md`: `![Phase](https://img.shields.io/badge/dynamic/json?label=phase&query=%24.phase&url=...)` pointing at the raw `phase-status.json` URL. Since the repo is **private**, this badge won't work for public viewers — that's fine, it's for the owner's own dashboard view. Document this caveat in `CONTRIBUTING.md`: "The phase badge requires repo read access to render. For public-facing status, expose phase-status.json via a Vercel API route after launch."

---

## A note on the commit history Claude Code creates while doing Phase 1+

Once these workflows are in place, **you (Claude Code) will be making commits** as you work through Phase 1's checkpoints. Follow these rules:

- One commit per coherent unit. Examples of right-sized commits:
  - `feat(desk): add desk surface with bevel and matte material`
  - `feat(desk): add lamp arm and shade geometry`
  - `feat(desk): add lamp emissive material and key light`
  - `style(desk): tune key light intensity and falloff`
- Each commit should pass the pre-commit hooks. If it doesn't, fix it before committing — never `--no-verify`.
- A checkpoint exit (e.g., end of Checkpoint A) gets a final summary commit: `docs(worklog): close phase 1 checkpoint A` that updates the worklog manually with the detailed paragraph.
- **Absolutely no `Co-Authored-by: Claude` trailers.** Plain commits.

If you find yourself about to make a commit with >500 lines of diff that doesn't fit one of the patterns above, stop and split it.

---

## Verification block

After all five pieces are applied:

1. `pnpm install` succeeds; husky installs hooks (check `.husky/` directory exists and is populated).
2. Make a test commit with a deliberately bad message (`bad commit message`). The commit-msg hook rejects it.
3. Make a test commit with a Co-Authored-by trailer:
   ```
   feat(desk): test
   
   Co-Authored-by: Test <test@test.com>
   ```
   The commit-msg hook rejects it before commitlint runs. Verify the rejection message names the trailer.
4. Make a valid test commit (`chore: test commitlint config`); it passes both hooks.
5. **Revert the test commits** with `git reset --hard HEAD~N` so the history stays clean. None of the test commits should land in `main`.
6. `pnpm typecheck && pnpm lint && pnpm lint:colors && pnpm build && pnpm bundle:check` all pass.
7. Manually run `node scripts/sync-worklog.mjs` against the current repo. It should exit 0 with no changes (worklog is already current with no new "real" commits to sync).
8. Manually run `node scripts/check-commit-size.mjs HEAD~5 HEAD` (or however many recent commits exist). It reports stats; no commit should warn (the existing Phase 0.5 commits are small).
9. `.github/workflows/` contains `ci.yml`, `worklog-sync.yml`, `phase-status.yml`. Each is syntactically valid YAML.
10. `CONTRIBUTING.md` exists and contains the required sections.

## Final summary

When complete, post in chat:

- **Pieces applied:** 1, 2, 3, 4, 5
- **Hook check outputs:** the rejection messages from the bad-commit-message test and the Co-Authored-by test (paste verbatim).
- **Files added:** [list]
- **Files modified:** [list, excluding the worklog auto-syncs]
- **Anything you decided that wasn't specified above:** [list with rationale]
- **Outstanding owner actions:** branch protection rules to configure in GitHub UI (per CONTRIBUTING.md §Branch protection).

Then stop. Wait for owner approval. After approval, the next step is Phase 1 Checkpoint A — but the owner will kick that off separately.
