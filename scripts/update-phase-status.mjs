// Reads docs/04-roadmap.md and writes phase-status.json with the first phase
// whose checkboxes aren't all `[x]`. Used by the phase-status workflow to drive
// the README badge.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROADMAP = 'docs/04-roadmap.md';

if (!existsSync(ROADMAP)) {
  console.error(`${ROADMAP} not found`);
  process.exit(1);
}

const lines = readFileSync(ROADMAP, 'utf8').split('\n');

// Phase headings look like:  ## Phase 0 — Foundations *(this week)*
// We capture everything up to the optional em-dash detail.
const phaseRe = /^##\s+(Phase\s+[\d.]+[^—\n]*)/;

let currentPhase = null;
let currentStartedAt = -1;
const phases = [];

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(phaseRe);
  if (m) {
    if (currentPhase) {
      phases.push({
        title: currentPhase,
        body: lines.slice(currentStartedAt + 1, i),
      });
    }
    currentPhase = m[1].trim();
    currentStartedAt = i;
  }
}
if (currentPhase) {
  phases.push({ title: currentPhase, body: lines.slice(currentStartedAt + 1) });
}

let firstIncomplete = null;
for (const p of phases) {
  const boxes = p.body.filter(l => /^-\s*\[[ x]\]/i.test(l));
  if (boxes.length === 0) continue;
  const unchecked = boxes.filter(l => /^-\s*\[\s\]/i.test(l));
  if (unchecked.length > 0) {
    firstIncomplete = { phase: p.title, remaining: unchecked.length, total: boxes.length };
    break;
  }
}

let existing = null;
try {
  if (existsSync('phase-status.json')) {
    existing = JSON.parse(readFileSync('phase-status.json', 'utf8'));
  }
} catch {
  // ignore
}

const nextPhase = firstIncomplete ? firstIncomplete.phase : (phases.at(-1)?.title ?? 'unknown');
const nextStatus = firstIncomplete ? 'in-progress' : 'complete';
const nextRemaining = firstIncomplete ? firstIncomplete.remaining : 0;
const nextTotal = firstIncomplete ? firstIncomplete.total : 0;

const isUnchanged = existing &&
  existing.phase === nextPhase &&
  existing.status === nextStatus &&
  existing.remaining === nextRemaining &&
  existing.total === nextTotal;

const updatedAt = isUnchanged && existing.updatedAt ? existing.updatedAt : new Date().toISOString();

const out = {
  phase: nextPhase,
  status: nextStatus,
  remaining: nextRemaining,
  total: nextTotal,
  updatedAt,
};

// Only write to file if there are actual modifications or if file doesn't exist
const newContent = JSON.stringify(out, null, 2) + '\n';
const shouldWrite = !isUnchanged || !existsSync('phase-status.json') || readFileSync('phase-status.json', 'utf8') !== newContent;

if (shouldWrite) {
  writeFileSync('phase-status.json', newContent);
  console.log(`phase-status: updated ${out.phase} (${out.status}), remaining: ${out.remaining}`);
} else {
  console.log(`phase-status: unchanged ${out.phase} (${out.status})`);
}
