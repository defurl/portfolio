#!/usr/bin/env node
// Smoke tests for the Claude Code hook scripts.
// Runs each hook with a synthetic event and asserts on stdout.

import { spawn } from 'node:child_process';
import { readFile, stat, rm } from 'node:fs/promises';
import { realpath } from 'node:fs/promises';

const HOOK = name => `scripts/claude-hooks/${name}.mjs`;
const HOOK_LOG = '.claude/hook-log.jsonl';

let failed = 0;

function runHook(scriptPath, input) {
  return new Promise(resolve => {
    const proc = spawn(process.execPath, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => resolve({ out, err, code }));
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed += 1;
  }
}

// Reset bypass log
try { await rm(HOOK_LOG); } catch {}

// 2. Bloaty extension denial
{
  const ev = { tool_name: 'Bash', tool_input: { command: 'cat package.json' } };
  const { out } = await runHook(HOOK('bash-guard'), JSON.stringify(ev));
  const parsed = out ? JSON.parse(out) : null;
  const reason = parsed?.hookSpecificOutput?.permissionDecisionReason ?? '';
  check(
    'bash-guard denies `cat package.json`',
    parsed?.hookSpecificOutput?.permissionDecision === 'deny' && /\.md\/\.json/.test(reason),
    parsed ? '' : `stdout: "${out}"`,
  );
}

// 3. Allow path
{
  const ev = { tool_name: 'Bash', tool_input: { command: 'git status' } };
  const { out } = await runHook(HOOK('bash-guard'), JSON.stringify(ev));
  check('bash-guard allows `git status` (empty stdout)', out === '', `stdout: "${out}"`);
}

// 4. Bypass marker
{
  const ev = { tool_name: 'Bash', tool_input: { command: 'cat README.md # bypass:hooks' } };
  const { out } = await runHook(HOOK('bash-guard'), JSON.stringify(ev));
  let logged = false;
  try {
    const s = await stat(HOOK_LOG);
    if (s.size > 0) {
      const txt = await readFile(HOOK_LOG, 'utf8');
      logged = /manual_bypass/.test(txt);
    }
  } catch {}
  check('bash-guard bypasses with marker AND logs', out === '' && logged, `stdout: "${out}", logged: ${logged}`);
}

// Verify git log without bound is denied
{
  const ev = { tool_name: 'Bash', tool_input: { command: 'git log' } };
  const { out } = await runHook(HOOK('bash-guard'), JSON.stringify(ev));
  const parsed = out ? JSON.parse(out) : null;
  const reason = parsed?.hookSpecificOutput?.permissionDecisionReason ?? '';
  check('bash-guard denies bare `git log`', /git log\` requires/.test(reason), reason || out);
}

// Verify pnpm build without pipe is denied
{
  const ev = { tool_name: 'Bash', tool_input: { command: 'pnpm build' } };
  const { out } = await runHook(HOOK('bash-guard'), JSON.stringify(ev));
  const parsed = out ? JSON.parse(out) : null;
  const reason = parsed?.hookSpecificOutput?.permissionDecisionReason ?? '';
  check('bash-guard denies unpipped `pnpm build`', /tail -n/.test(reason), reason || out);
}

// 5. read-guard on a large file
{
  const arch = await realpath('docs/03-architecture.md');
  const ev = { tool_name: 'Read', tool_input: { file_path: arch } };
  const { out } = await runHook(HOOK('read-guard'), JSON.stringify(ev));
  const parsed = out ? JSON.parse(out) : null;
  const reason = parsed?.hookSpecificOutput?.permissionDecisionReason ?? '';
  check(
    'read-guard denies whole-file read of >200-line file',
    parsed?.hookSpecificOutput?.permissionDecision === 'deny' && /offset.*limit/i.test(reason),
    reason || out,
  );
}

// 6. read-guard with limit allows
{
  const arch = await realpath('docs/03-architecture.md');
  const ev = { tool_name: 'Read', tool_input: { file_path: arch, limit: 50 } };
  const { out } = await runHook(HOOK('read-guard'), JSON.stringify(ev));
  check('read-guard allows when `limit` set', out === '', `stdout: "${out}"`);
}

// 7. output-nudge fires on large response
{
  const big = 'x'.repeat(25000);
  const ev = { tool_name: 'Bash', tool_response: big };
  const { out } = await runHook(HOOK('output-nudge'), JSON.stringify(ev));
  const parsed = out ? JSON.parse(out) : null;
  const ctx = parsed?.hookSpecificOutput?.additionalContext ?? '';
  check('output-nudge fires on >20KB response', /subagent/i.test(ctx), ctx || out);
}

// output-nudge silent on small response
{
  const ev = { tool_name: 'Bash', tool_response: 'small' };
  const { out } = await runHook(HOOK('output-nudge'), JSON.stringify(ev));
  check('output-nudge silent on small response', out === '', `stdout: "${out}"`);
}

if (failed > 0) {
  console.error(`\n${failed} hook test(s) failed.`);
  process.exit(1);
}
console.log('\nAll hook tests passed.');
