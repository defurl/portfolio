#!/usr/bin/env node
// PreToolUse hook for Read. Denies whole-file reads of files >200 lines
// when no offset/limit is set.

import { open } from 'node:fs/promises';

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
