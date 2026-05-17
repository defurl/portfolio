// Append auto-synced bullet entries to worklog.md from the git log.
//
// Tracks position via a hidden HTML comment at the top of worklog.md:
//   <!-- worklog-sync: lastCommitSha=<sha> -->
//
// Behavior:
// - Reads the marker; if absent, uses the most recent commit that touched worklog.md.
// - Walks `git log <marker>..HEAD`, filters out `docs(worklog):` commits.
// - Groups remaining commits by their author date (UTC, YYYY-MM-DD).
// - For each date group, appends an `## YYYY-MM-DD — auto-synced from git log` entry.
// - Updates the marker. Exits 0 silently if there's nothing to do.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const WORKLOG = 'worklog.md';
const MARKER_RE = /<!--\s*worklog-sync:\s*lastCommitSha=([a-f0-9]+)\s*-->/i;

function git(...a) {
  return execFileSync('git', a, { encoding: 'utf8' }).trim();
}

if (!existsSync(WORKLOG)) {
  console.error(`${WORKLOG} not found`);
  process.exit(0);
}

let content = readFileSync(WORKLOG, 'utf8');

let lastSha;
const markerMatch = content.match(MARKER_RE);
if (markerMatch) {
  lastSha = markerMatch[1];
} else {
  try {
    lastSha = git('log', '-n', '1', '--pretty=format:%H', '--', WORKLOG);
  } catch {
    lastSha = '';
  }
}

let range;
try {
  range = lastSha ? `${lastSha}..HEAD` : 'HEAD';
  git('rev-parse', range.split('..')[0] || 'HEAD');
} catch {
  range = 'HEAD';
}

let log;
try {
  log = git('log', '--no-merges', '--reverse', '--pretty=format:%H%x09%s%x09%aI', range);
} catch {
  log = '';
}

if (!log) {
  // Nothing to sync.
  process.exit(0);
}

const commits = log
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const [sha, subject, date] = line.split('\t');
    return { sha, subject, date: date.slice(0, 10) };
  })
  .filter(c => !c.subject.startsWith('docs(worklog):'));

if (commits.length === 0) {
  process.exit(0);
}

// Group by date.
const byDate = new Map();
for (const c of commits) {
  if (!byDate.has(c.date)) byDate.set(c.date, []);
  byDate.get(c.date).push(c);
}

let additions = '';
for (const [date, list] of byDate) {
  additions += `\n## ${date} — auto-synced from git log\n`;
  for (const c of list) {
    additions += `- ${c.subject} (\`${c.sha.slice(0, 7)}\`)\n`;
  }
}

const newestSha = commits[commits.length - 1].sha;
const newMarker = `<!-- worklog-sync: lastCommitSha=${newestSha} -->`;

if (markerMatch) {
  content = content.replace(MARKER_RE, newMarker);
} else {
  content = `${newMarker}\n${content}`;
}

if (!content.endsWith('\n')) content += '\n';
content += additions;

writeFileSync(WORKLOG, content);
console.log(`worklog-sync: appended ${commits.length} commit(s) across ${byDate.size} date group(s); marker → ${newestSha.slice(0, 7)}`);
