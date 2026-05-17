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

const out = firstIncomplete
  ? {
      phase: firstIncomplete.phase,
      status: 'in-progress',
      remaining: firstIncomplete.remaining,
      total: firstIncomplete.total,
      updatedAt: new Date().toISOString(),
    }
  : {
      phase: phases.at(-1)?.title ?? 'unknown',
      status: 'complete',
      remaining: 0,
      total: 0,
      updatedAt: new Date().toISOString(),
    };

writeFileSync('phase-status.json', JSON.stringify(out, null, 2) + '\n');
console.log(`phase-status: ${out.phase} (${out.status})`);
