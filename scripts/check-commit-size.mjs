// Commit-size discipline. Warns on commits that look like dumps, hard-blocks
// on runaways. Invoked from .husky/pre-push and runnable standalone:
//
//   node scripts/check-commit-size.mjs <fromRef> <toRef>
//
// Defaults to `origin/main..HEAD` when called from pre-push without args.
import { execFileSync } from 'node:child_process';

const WARN_LINES = 500;
const WARN_FILES = 15;
const BLOCK_LINES = 2000;

const args = process.argv.slice(2);
const fromRef = args[0] ?? 'origin/main';
const toRef = args[1] ?? 'HEAD';
const range = `${fromRef}..${toRef}`;

function git(...a) {
  return execFileSync('git', a, { encoding: 'utf8' });
}

let log;
try {
  log = git('log', '--no-merges', '--pretty=format:%H%x09%s', range);
} catch {
  // Range doesn't exist (e.g., first push, no origin/main yet). Nothing to check.
  process.exit(0);
}

const commits = log
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const [sha, ...rest] = line.split('\t');
    return { sha, subject: rest.join('\t') };
  });

if (commits.length === 0) process.exit(0);

let warned = 0;
let blocked = 0;

for (const c of commits) {
  const numstat = git('show', '--no-renames', '--numstat', '--format=', c.sha).trim();
  if (!numstat) continue;
  let added = 0;
  let deleted = 0;
  let files = 0;
  for (const row of numstat.split('\n')) {
    const [a, d] = row.split('\t');
    if (a === '-' || d === '-') continue; // binary
    added += Number(a) || 0;
    deleted += Number(d) || 0;
    files += 1;
  }
  const total = added + deleted;
  const short = c.sha.slice(0, 7);
  if (total > BLOCK_LINES) {
    console.error(`✗ ${short} ${c.subject}`);
    console.error(`  ${total} lines / ${files} files — exceeds hard limit (${BLOCK_LINES}). Split this commit.`);
    blocked += 1;
  } else if (total > WARN_LINES || files > WARN_FILES) {
    console.warn(`! ${short} ${c.subject}`);
    console.warn(`  ${total} lines / ${files} files — consider splitting this commit; see CONTRIBUTING.md`);
    warned += 1;
  } else {
    console.log(`✓ ${short} ${c.subject} — ${total} lines / ${files} files`);
  }
}

if (blocked > 0) {
  console.error(`\n${blocked} commit(s) exceed the ${BLOCK_LINES}-line hard limit. Push aborted.`);
  process.exit(1);
}
if (warned > 0) {
  console.warn(`\n${warned} large commit(s) — push allowed but reconsider before merging.`);
}
process.exit(0);
