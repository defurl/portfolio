# Tool-use rules

> Token discipline for Claude Code sessions. Mechanical enforcement lives in `.claude/settings.json` hooks; the rules below explain *why* and provide the patterns to follow.
>
> **Escape hatch:** any rule below can be bypassed for a single command by appending the literal comment `# bypass:hooks` to the bash command. Use sparingly; the bypass is logged.

## Why these rules exist

Tool outputs fill 60–80% of Claude Code's context in a typical coding session. Every wasted token is one less token of working memory for reasoning. The rules below target the highest-impact culprits.

## File reading

| Rule | Why |
|---|---|
| For files >200 lines, use the Read tool with `offset` and `limit`, never read whole | A 600-line file is ~6K tokens raw |
| Never `cat`/`type`/`Get-Content` on `.md`, `.json`, `.lock`, `.log`, `.csv`, `.svg` in bash | Use Read with a limit instead |
| For directory exploration, use the Read tool on the directory (returns a structured listing) | `ls -R` returns thousands of lines |
| For "is this file even here," use Glob, not Read | Glob returns paths only |

## Searching

| Rule | Why |
|---|---|
| For "where is X used", use Grep with `output_mode: "files_with_matches"` first | Filename-only is ~50× smaller |
| Cap Grep results with `head_limit` (default to 50 if you don't know) | Unbounded grep on a large repo can return >10K tokens |
| Prefer Glob for filename patterns; Grep is for content | Don't pay the content-scan cost twice |
| Never run `grep -r` or `rg` without `--max-count` in bash | Same reasoning, applies to bash-invoked search |

## Build, test, and dev-server output

| Rule | Why |
|---|---|
| For `pnpm build`, `pnpm dev`, `pnpm typecheck` — always pipe through `tail -n 30` unless investigating | A clean build is 1–3K tokens; the last 30 lines tell you pass/fail and any errors |
| For `pnpm test`, pipe through `tail -n 40` or extract the summary line | Test logs can run to 5K+ tokens |
| For `pnpm install`, pipe through `tail -n 10` | Installs are ~2K of progress noise |
| For `pnpm bundle:check`, full output is fine (it's a single line) | No pipe needed |
| For `pnpm lh:check`, pipe through `tail -n 50` | LHCI is verbose |

If you're investigating a failure, run the unpipped command **once** to see the error context, then return to piped runs.

## Git

| Rule | Why |
|---|---|
| `git log` requires one of `--oneline`, `--stat`, `-n <N>`, or a path filter | Bare `git log` returns the entire history |
| For diffs, run `git diff --stat` first to see scope, then targeted `git diff <file>` | Full diffs of multi-file changes are unbounded |
| `git status` is fine unpiped (always small) | — |
| `git show <sha>` requires a path argument or `--stat` | Same as diff |

## Subagent dispatch (hard thresholds)

Dispatch a subagent via the Task tool when any of these are true:

| Threshold | Rationale |
|---|---|
| Reading or searching across **>10 source files** in one task | Each file read adds 1–5K tokens to main context; subagent isolates |
| Investigating a failure where the log/output is **>2,000 lines** | Subagent reads it, summarizes, returns 200 tokens instead of 20K |
| Migration or refactor touching **>15 files** | Same reasoning |
| Any task with the prefix verb **"investigate," "audit," "survey," "map," or "trace"** | These imply exploration, which is always token-heavy |
| Estimated tool-output cost **>5K tokens** before the work begins | Use judgment; when in doubt, dispatch |

Subagents return only their final message to the main conversation. The verbose exploration stays in their isolated context window.

## Session hygiene

| When | Do |
|---|---|
| After completing a checkpoint or feature | Run `/compact` manually with the custom prompt (preserves CLAUDE.md and decisions, drops tool outputs) |
| When pivoting to an unrelated task | Run `/clear` and start fresh |
| When context utilization passes ~75% | Stop and either `/compact` or `/clear`; do not run until 95% |
| When the project worklog is queried | Read only the last 30 lines (use Read with offset) — older entries are reachable but rarely needed |

## The escape hatch

Append `# bypass:hooks` to any bash command to skip mechanical enforcement for that one call. Example:

```bash
git log # bypass:hooks
```

This is logged to `.claude/hook-log.jsonl` (gitignored). If a single session has >5 bypasses, the rules need updating, not the bypass extending.

## Owner setup — user-level `~/.claude/settings.json`

The following block belongs in your **user-level** Claude Code settings (not committed to this repo). It overrides the default compaction prompt to preserve rules and decisions while aggressively dropping tool-output bloat:

```json
{
  "compactPrompt": "When compacting, preserve verbatim:\n1. All rules and constraints from CLAUDE.md and docs/tooling-rules.md\n2. Current phase, checkpoint, and task progress\n3. File paths, error messages, and architectural decisions made this session\n4. User corrections, preferences, and the design-spec.jsonc anti-patterns\n\nYou may aggressively summarize or drop:\n- Tool call outputs (keep conclusions only, drop raw stdout/stderr)\n- File contents that were read (keep what was learned, drop the verbatim text)\n- Exploratory steps that led nowhere\n- Hook denial messages (keep only if the denial reason changed approach)\n\nThe summary should let any Claude Code session resume this work coherently."
}
```

This file is your responsibility to maintain; it isn't checked in. If you change machines or wipe your settings, paste this back.
