#!/usr/bin/env node
// PreToolUse hook for Bash. Denies commands that would dump excessive output
// into the conversation context. Returns a clear reason so Claude can retry.
//
// Escape hatch: any command ending in `# bypass:hooks` is allowed through and logged.

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const BYPASS_MARKER = '# bypass:hooks';
const HOOK_LOG = '.claude/hook-log.jsonl';

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let event;
try { event = JSON.parse(raw); } catch { process.exit(0); }

const cmd = event?.tool_input?.command ?? '';
if (typeof cmd !== 'string' || !cmd.trim()) process.exit(0);

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
