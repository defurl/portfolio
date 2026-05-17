# Phase 0.7 — Tool-use rules + mechanical enforcement via hooks

You completed Phase 0.6. Before Phase 1 begins, set up the tool-use ruleset and the Claude Code hooks that enforce it mechanically. The goal: cut tool-output context bloat (typically 60–80% of session tokens) by both **telling you how to call tools efficiently** (the conventional layer) and **denying inefficient calls when they happen anyway** (the mechanical layer).

Strict enforcement is the explicit choice. When a rule can be expressed as a hook, it must be.

## Operating rules

1. **Re-read `CLAUDE.md`, `CONTEXT.md`, `design-spec.jsonc` first.**
2. **No new third-party dependencies.** Hooks are plain Node scripts using only stdin/stdout. No npm packages.
3. **Append to `worklog.md` after each piece lands**, per the protocol in `CLAUDE.md`.
4. **Stop when all four pieces are applied and the verification block passes.** Do not begin Phase 1.

---

## Piece 1 — `docs/tooling-rules.md`

Create this file. It's the canonical reference for the tool-use ruleset. CLAUDE.md will link to it. Structure:

```markdown
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
```

## Piece 2 — `CLAUDE.md` addendum

Append a new section to `CLAUDE.md`, placed **after** "Repo conventions" and **before** "Definition of done":

```markdown
## Tool-use discipline

The full rules are in `docs/tooling-rules.md`. The cliff notes:

- **File reads**: use Read with `offset`+`limit` for anything over 200 lines; never `cat` markdown/json/lock/log files.
- **Search**: Grep with `output_mode: "files_with_matches"` first; cap with `head_limit`; never `grep -r`/`rg` unbounded.
- **Build/test**: always pipe `pnpm build|test|dev|install` through `tail -n N`; full output only when investigating a known failure.
- **Git**: `git log` requires `--oneline`/`--stat`/`-n`; diffs go through `--stat` first.
- **Subagent dispatch (hard)**: dispatch when reading >10 files, investigating >2K-line logs, touching >15 files, or any task verb of "investigate / audit / survey / map / trace."
- **Hygiene**: `/compact` after each checkpoint, `/clear` between unrelated tasks.

The mechanical enforcement lives in `.claude/settings.json` PreToolUse hooks; they will deny non-conforming commands with a reason. To bypass for a single call, append `# bypass:hooks` to the command.

Reference: `docs/tooling-rules.md`.
```

## Piece 3 — Hook scripts in `scripts/claude-hooks/`

Create three Node ESM scripts. Each reads the hook event JSON from stdin and emits JSON to stdout. Exit 0 always (we use `permissionDecision: "deny"` for soft denials, never exit 2 — denials are recoverable by Claude, exit 2 is a hard error).

### `scripts/claude-hooks/bash-guard.mjs`

```js
#!/usr/bin/env node
// PreToolUse hook for Bash. Denies commands that would dump excessive output
// into the conversation context. Returns a clear reason so Claude can retry.
//
// Escape hatch: any command ending in `# bypass:hooks` is allowed through and logged.

import { appendFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const BYPASS_MARKER = '# bypass:hooks';

const HOOK_LOG = '.claude/hook-log.jsonl';

// Read stdin
let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let event;
try { event = JSON.parse(raw); } catch { process.exit(0); }

const cmd = event?.tool_input?.command ?? '';
if (typeof cmd !== 'string' || !cmd.trim()) process.exit(0);

// Bypass
if (cmd.includes(BYPASS_MARKER)) {
  await logBypass(cmd, 'manual_bypass');
  process.exit(0);
}

const denials = checkRules(cmd);
if (denials.length === 0) process.exit(0);

const reason = [
  'Bash command denied by tooling rules (see docs/tooling-rules.md):',
  ...denials.map(d => `  - ${d}`),
  '',
  'Retry with the suggested form, or append `# bypass:hooks` to the command if intentional.',
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
  },
}));

// ---- helpers ----

function checkRules(cmd) {
  const denials = [];
  // Normalize: collapse whitespace, strip comments (except bypass — already handled)
  const c = cmd.replace(/\s+/g, ' ').trim();

  // 1. cat/type/Get-Content on bloaty extensions
  const bloatyExt = /\b(cat|type|Get-Content)\b\s+[^\s|;&]*\.(md|json|lock|log|csv|svg|tsbuildinfo)\b/i;
  if (bloatyExt.test(c)) {
    denials.push('Use the Read tool with `offset`/`limit` instead of `cat`/`type` on .md/.json/.lock/.log/.csv/.svg files.');
  }

  // 2. Recursive ls
  if (/\bls\b[^|;&]*\s-\w*R/.test(c) || /\bls\b[^|;&]*\s-R\b/.test(c)) {
    denials.push('Use the Read tool on the directory instead of `ls -R`.');
  }

  // 3. git log without a bounding flag
  if (/\bgit\s+log\b/.test(c)) {
    const hasBound = /(--oneline|--stat|--graph\b|\s-n\s*\d+|\s--max-count\s*=?\s*\d+|--shortstat|--name-status|--name-only|--pretty=oneline)/.test(c);
    const hasPathFilter = /\bgit\s+log\b[^|;&]*--\s+\S+/.test(c);
    if (!hasBound && !hasPathFilter) {
      denials.push('`git log` requires `--oneline`, `--stat`, `-n <N>`, or a `-- <path>` filter.');
    }
  }

  // 4. git show without bounds
  if (/\bgit\s+show\b/.test(c)) {
    const hasBound = /(--stat|--shortstat|--name-status|--name-only|--pretty=oneline)/.test(c);
    const hasPath = /\bgit\s+show\b\s+\S+\s+--?\s+\S+/.test(c);
    if (!hasBound && !hasPath) {
      denials.push('`git show` requires `--stat`/`--name-status` or an explicit `-- <path>` argument.');
    }
  }

  // 5. Recursive grep / rg without max-count
  if (/\bgrep\b[^|;&]*\s-\w*r/.test(c) || /\bgrep\b[^|;&]*\s-r\b/.test(c)) {
    const hasMax = /(-m\s+\d+|--max-count[= ]\d+)/.test(c);
    if (!hasMax) denials.push('Recursive `grep -r` requires `-m <N>` or `--max-count=<N>`. Prefer the Grep tool with `output_mode: "files_with_matches"`.');
  }
  if (/\brg\b/.test(c)) {
    const hasMax = /(-m\s+\d+|--max-count[= ]\d+|--files-with-matches|-l\b)/.test(c);
    if (!hasMax) denials.push('`rg` requires `--max-count`, `-m <N>`, or `-l`. Prefer the Grep tool.');
  }

  // 6. Build/test/install without pipe to head/tail/grep
  const verbose = /\bpnpm\s+(build|dev|test|typecheck|install|lh:check)\b/;
  if (verbose.test(c)) {
    const piped = /\|\s*(tail|head|grep|awk|sed|jq)\b/.test(c);
    const captured = /\s>\s*\S+/.test(c) || /\s2>&1\s*>\s*\S+/.test(c);
    if (!piped && !captured) {
      denials.push('Pipe `pnpm build/dev/test/typecheck/install/lh:check` through `| tail -n N` (or capture to a file) unless investigating a known failure.');
    }
  }

  return denials;
}

async function logBypass(command, kind) {
  try {
    await mkdir(dirname(HOOK_LOG), { recursive: true });
    await appendFile(HOOK_LOG, JSON.stringify({
      ts: new Date().toISOString(),
      kind,
      command,
    }) + '\n');
  } catch {}
}
```

### `scripts/claude-hooks/read-guard.mjs`

```js
#!/usr/bin/env node
// PreToolUse hook for Read. Denies whole-file reads of files >200 lines
// when no offset/limit is set.

import { stat, open } from 'node:fs/promises';

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let event;
try { event = JSON.parse(raw); } catch { process.exit(0); }

const input = event?.tool_input ?? {};
const filePath = input.file_path;
const hasLimit = Number.isFinite(input.limit);
const hasOffset = Number.isFinite(input.offset);

if (!filePath || hasLimit || hasOffset) process.exit(0);

// Count lines (cheap: read stream, count \n up to threshold + 1)
const threshold = 200;
let lines = 0;
try {
  const fh = await open(filePath, 'r');
  try {
    const buf = Buffer.alloc(64 * 1024);
    while (lines <= threshold) {
      const { bytesRead } = await fh.read(buf, 0, buf.length, null);
      if (!bytesRead) break;
      for (let i = 0; i < bytesRead; i++) if (buf[i] === 0x0a) {
        lines++;
        if (lines > threshold) break;
      }
    }
  } finally { await fh.close(); }
} catch {
  // file unreadable — let the tool itself surface the error
  process.exit(0);
}

if (lines <= threshold) process.exit(0);

const reason = [
  `File has ${lines}+ lines; whole-file read denied (threshold: ${threshold}).`,
  '',
  `Re-call Read with \`offset\` and \`limit\` to scope the read.`,
  `If you genuinely need the whole file, set \`limit: ${lines + 50}\` explicitly to acknowledge the cost.`,
  '',
  'See docs/tooling-rules.md.',
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
  },
}));
```

### `scripts/claude-hooks/output-nudge.mjs`

```js
#!/usr/bin/env node
// PostToolUse hook (matcher: "Bash|Read|Grep"). Cannot deny (post-tool can't undo)
// but injects `additionalContext` warning when a single tool call returned an
// unusually large amount of text — nudging Claude toward subagent dispatch or
// tighter calls next time.

const LARGE_BYTES = 20000; // ~5K tokens

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let event;
try { event = JSON.parse(raw); } catch { process.exit(0); }

const resp = event?.tool_response;
if (!resp) process.exit(0);

// Heuristic: serialize the tool_response and measure
const serialized = typeof resp === 'string' ? resp : JSON.stringify(resp);
const bytes = Buffer.byteLength(serialized, 'utf8');

if (bytes < LARGE_BYTES) process.exit(0);

const approxTokens = Math.round(bytes / 4);
const msg = [
  `[tooling-nudge] That ${event.tool_name} call returned ~${approxTokens} tokens (${bytes} bytes).`,
  `Per docs/tooling-rules.md, calls returning >5K tokens are subagent candidates.`,
  `Consider: (a) re-running with tighter scope, (b) dispatching a subagent for similar follow-ups, or (c) running /compact at the next natural break.`,
].join(' ');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: msg,
  },
}));
```

Make all three scripts executable (`chmod +x`). On Windows the shebang is ignored but Node still runs them; ensure the settings.json command invokes `node` explicitly to be safe.

## Piece 4 — `.claude/settings.json`

Create this file (project-level, committed). If it already exists from Phase 0.6 work, merge. The full hook configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/scripts/claude-hooks/bash-guard.mjs",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/scripts/claude-hooks/read-guard.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Read|Grep",
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/scripts/claude-hooks/output-nudge.mjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Also update `.gitignore` to exclude `.claude/hook-log.jsonl` (the bypass log). Update `.claude/` is otherwise committed (per Phase 0.6).

## Piece 5 — User-level `compactPrompt` documentation

The custom compaction prompt lives in `~/.claude/settings.json` (user-level, NOT in the repo — it's per-machine). Document the recommended content in `docs/tooling-rules.md` under a new "Owner setup" section at the end:

```markdown
## Owner setup — user-level `~/.claude/settings.json`

The following block belongs in your **user-level** Claude Code settings (not committed to this repo). It overrides the default compaction prompt to preserve rules and decisions while aggressively dropping tool-output bloat:

```json
{
  "compactPrompt": "When compacting, preserve verbatim:\n1. All rules and constraints from CLAUDE.md and docs/tooling-rules.md\n2. Current phase, checkpoint, and task progress\n3. File paths, error messages, and architectural decisions made this session\n4. User corrections, preferences, and the design-spec.jsonc anti-patterns\n\nYou may aggressively summarize or drop:\n- Tool call outputs (keep conclusions only, drop raw stdout/stderr)\n- File contents that were read (keep what was learned, drop the verbatim text)\n- Exploratory steps that led nowhere\n- Hook denial messages (keep only if the denial reason changed approach)\n\nThe summary should let any Claude Code session resume this work coherently."
}
```

This file is your responsibility to maintain; it isn't checked in. If you change machines or wipe your settings, paste this back.
```

---

## Verification block

After all pieces are applied:

1. `pnpm typecheck && pnpm lint && pnpm lint:colors && pnpm build && pnpm bundle:check` — all pass.
2. Verify hook scripts are valid by piping a synthetic event:
   ```bash
   echo '{"tool_name":"Bash","tool_input":{"command":"cat package.json"}}' | node scripts/claude-hooks/bash-guard.mjs
   ```
   Should emit a JSON denial mentioning `.md/.json/.lock/.log/.csv/.svg`.
3. Verify allow path:
   ```bash
   echo '{"tool_name":"Bash","tool_input":{"command":"git status"}}' | node scripts/claude-hooks/bash-guard.mjs
   ```
   Should emit nothing (exit 0, empty stdout).
4. Verify bypass:
   ```bash
   echo '{"tool_name":"Bash","tool_input":{"command":"cat README.md # bypass:hooks"}}' | node scripts/claude-hooks/bash-guard.mjs
   ```
   Should emit nothing, and `.claude/hook-log.jsonl` should now contain an entry.
5. Verify read-guard on a large file:
   ```bash
   echo "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$(realpath docs/03-architecture.md)\"}}" | node scripts/claude-hooks/read-guard.mjs
   ```
   Should emit a JSON denial mentioning offset/limit (architecture doc is >200 lines).
6. Verify the same file with `limit` allows:
   ```bash
   echo "{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$(realpath docs/03-architecture.md)\",\"limit\":50}}" | node scripts/claude-hooks/read-guard.mjs
   ```
   Should emit nothing.
7. Verify output-nudge fires on a large response:
   ```bash
   node -e "const big='x'.repeat(25000); process.stdout.write(JSON.stringify({tool_name:'Bash',tool_response:big}))" | node scripts/claude-hooks/output-nudge.mjs
   ```
   Should emit JSON with `additionalContext` mentioning subagent candidates.
8. `pnpm test:hooks` (add this script to package.json that runs all six checks above as a shell test) — exits 0 only if all six produce the expected output. Use simple shell asserts; no new test framework.
9. The hook-log file is gitignored (`git check-ignore .claude/hook-log.jsonl` returns the file).

## Final summary

When complete, post in chat:

- **Pieces applied:** 1, 2, 3, 4, 5
- **Hook verification outputs:** paste the stdout from checks 2, 3, 5, 6, 7
- **Files added:** [list]
- **Files modified:** [list]
- **Anything you decided that wasn't specified:** [list]
- **Outstanding owner actions:** add `compactPrompt` to `~/.claude/settings.json` per Piece 5

Then stop. After this lands, the next decision point is whether to run `/caveman-compress` on CLAUDE.md (now that the tool-use addendum is in it) — that's a separate question for the owner.
