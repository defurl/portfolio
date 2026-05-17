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
