// Build-time fetch of recent GitHub activity for the desk TerminalPanel (1.15).
// Hits the public events API for the configured user, filters to PushEvent /
// PullRequestEvent from the last 7 days, and writes a normalized JSON file
// the TerminalPanel imports. Never fails the build — on any error it writes
// a graceful stub the panel renders as "activity unavailable."
//
// - Reads GITHUB_TOKEN from env if present (raises the rate limit 60→5000/hr).
// - Excludes repos listed in scripts/github-activity-exclude.json.
// - Skips the network entirely if the cached file is < 6h old (keeps `dev`
//   startup fast and avoids hammering the rate limit).
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

const USER = 'defurl';
const OUT = 'src/generated/github-activity.json';
const EXCLUDE_FILE = 'scripts/github-activity-exclude.json';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function isFresh() {
  try {
    const s = await stat(OUT);
    return Date.now() - s.mtimeMs < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

async function readExclude() {
  try {
    return new Set(JSON.parse(await readFile(EXCLUDE_FILE, 'utf8')));
  } catch {
    return new Set();
  }
}

async function write(data) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
}

const main = async () => {
  if (await isFresh()) {
    console.log('github-activity: cache fresh (<6h), skipping fetch');
    return;
  }

  const exclude = await readExclude();
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${USER}/events/public`, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const events = await res.json();
    const cutoff = Date.now() - WINDOW_MS;

    const items = [];
    for (const ev of events) {
      if (ev.type !== 'PushEvent' && ev.type !== 'PullRequestEvent') continue;
      if (new Date(ev.created_at).getTime() < cutoff) continue;
      const repo = ev.repo?.name ?? 'unknown';
      if (exclude.has(repo)) continue;

      if (ev.type === 'PushEvent') {
        for (const c of ev.payload?.commits ?? []) {
          items.push({ ts: ev.created_at, repo, message: c.message ?? '' });
        }
      } else {
        const pr = ev.payload?.pull_request;
        items.push({
          ts: ev.created_at,
          repo,
          message: `PR: ${pr?.title ?? ev.payload?.action ?? 'pull request'}`,
        });
      }
    }

    await write({ source: 'github', fetchedAt: new Date().toISOString(), items });
    console.log(`github-activity: wrote ${items.length} item(s)`);
  } catch (err) {
    await write({
      source: 'stub',
      fetchedAt: new Date().toISOString(),
      message: 'activity unavailable at build time',
      items: [],
    });
    console.warn(`github-activity: ${err.message} — wrote stub fallback`);
  }
};

main().catch(async err => {
  // Last-resort: even if main throws, leave a stub so the import never fails.
  await write({ source: 'stub', message: 'activity unavailable at build time', items: [] }).catch(() => {});
  console.warn(`github-activity: ${err.message} — wrote stub fallback`);
});
