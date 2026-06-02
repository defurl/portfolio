// Build-time fetch of public repos for the voxel city (Phase 3B).
//
// Hits GitHub once per build, normalizes results into BuildingData[], and
// writes src/generated/city-buildings.json (gitignored). On any error,
// writes a graceful stub so the city renders as empty rather than failing
// the build.
//
// Per-repo data (languages, README, commit count) is cached for 7 days under
// src/generated/.cache/ so subsequent builds skip the slow second-pass calls.
//
// Commit count: read from the `last-page` link header on
// /repos/{user}/{repo}/commits?per_page=1 — a single request gets us the
// total without paginating. Falls back to 0 if missing.

import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const USER = 'defurl';
const OUT = 'src/generated/city-buildings.json';
const CACHE_DIR = 'src/generated/.cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OUT_TTL_MS = 6 * 60 * 60 * 1000; // skip whole fetch if OUT is fresh
const MIN_REPO_SIZE_KB = 50;

const LANGUAGE_TO_DISTRICT = {
  Python: 'ml',
  'Jupyter Notebook': 'ml',
  Rust: 'others',
  Go: 'others',
  TypeScript: 'softwares',
  JavaScript: 'softwares',
  C: 'others',
  'C++': 'others',
  Solidity: 'softwares',
  Shell: 'others',
  Dockerfile: 'others',
  HTML: 'softwares',
  CSS: 'softwares',
  Vue: 'softwares',
  Kotlin: 'softwares',
  Swift: 'softwares',
  'C#': 'softwares',
  PHP: 'softwares',
};
const VALID_DISTRICTS = new Set(['softwares', 'coursework', 'ml', 'others']);

// Local curation overrides for perfect thematic district and premium description mapping
const REPO_DISTRICT_OVERRIDES = {
  'defurl/portfolio': 'softwares',
  'defurl/studentLMS': 'softwares',
  'defurl/Intel-TradingAgent': 'ml',
  'defurl/Turnaround-AMS': 'softwares',
  'defurl/CLOUD-WEAVERS-Hackathon': 'others',
  'defurl/conversation-fetcher': 'others',
};

const REPO_DESCRIPTION_OVERRIDES = {
  'defurl/portfolio': 'A cinematic, high-fidelity 3D developer portfolio featuring an interactive Tadao Ando concrete desk, a real-time sonified Voxel City, and a live WebGL neural network corridor.',
  'defurl/Intel-TradingAgent': 'An intelligent quantitative algorithmic trading platform and agent leveraging machine learning and data pipelines to optimize active asset trading models.',
  'defurl/Turnaround-AMS': 'A collaborative React Native and Firebase airline operations application streamlining real-time flight turnaround metrics for airline ground crews.',
  'defurl/studentLMS': 'A structured typescript learning management system (LMS) coordinating student enrollment, coursework pipelines, and grading operations.',
  'defurl/memory-tree': 'A cognitive memory hierarchical data mapping utility written in Python for intelligent classification and structural indexing.',
  'defurl/Facial-Recognition-with-Emotion-Liveness-Detection': 'A deep-learning-driven real-time facial recognition pipeline featuring convolutional neural networks for liveness and emotion detection.',
  'defurl/CLOUD-WEAVERS-Hackathon': 'An experimental multi-tier serverless cloud orchestration system built during the Cloud Weavers hackathon event.',
  'defurl/COS30008---DataStructure-Algorithm': 'A comprehensive structural repository containing premium object-oriented C++ implementations of advanced sorting, trees, and graphs.',
};

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function write(data) {
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
}

async function cachePath(name) {
  return `${CACHE_DIR}/github-repo-${name.replace(/[^a-z0-9-]/gi, '_')}.json`;
}

async function loadCache(name) {
  try {
    const p = await cachePath(name);
    const s = await stat(p);
    if (Date.now() - s.mtimeMs > CACHE_TTL_MS) return null;
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function saveCache(name, data) {
  const p = await cachePath(name);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(p, JSON.stringify(data));
}

async function fetchJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return r.json();
}

async function fetchCommitCount(fullName) {
  // /commits?per_page=1 returns 1 item with a `last-page` link in the header
  // whose page number equals the total commit count.
  const r = await fetch(
    `https://api.github.com/repos/${fullName}/commits?per_page=1`,
    { headers },
  );
  if (!r.ok) return 0;
  const link = r.headers.get('link') ?? '';
  const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return m ? Number(m[1]) : 1;
}

async function fetchReadme(fullName) {
  try {
    const r = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: { ...headers, Accept: 'application/vnd.github.raw' },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function parseDistrictFromReadme(readme) {
  if (!readme) return null;
  // Frontmatter (---\n...\n---) or first 30 lines looking for `district: foo`
  const m = readme.match(/^\s*district\s*:\s*(\w+)/im);
  if (!m) return null;
  const d = m[1].toLowerCase();
  return VALID_DISTRICTS.has(d) ? d : null;
}

async function enrichRepo(repo) {
  const cached = await loadCache(repo.full_name);
  if (cached) return cached;

  const [languages, readme, commits] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${repo.full_name}/languages`).catch(() => ({})),
    fetchReadme(repo.full_name),
    fetchCommitCount(repo.full_name),
  ]);

  const entries = Object.entries(languages);
  entries.sort((a, b) => b[1] - a[1]);
  const primaryLanguage = entries[0]?.[0] ?? repo.language ?? 'Other';
  const additions = entries.reduce((s, [, b]) => s + b, 0);

  const districtFromOverride = REPO_DISTRICT_OVERRIDES[repo.full_name];
  const isCoursework = /^(cos|swe)\d+/i.test(repo.name);
  const districtFromReadme = parseDistrictFromReadme(readme);
  const district =
    districtFromOverride ??
    (isCoursework ? 'coursework' : null) ??
    districtFromReadme ??
    LANGUAGE_TO_DISTRICT[primaryLanguage] ??
    'others';

  const description = REPO_DESCRIPTION_OVERRIDES[repo.full_name] ?? repo.description;

  const data = {
    id: repo.full_name,
    name: repo.name,
    description,
    url: repo.html_url,
    district,
    primaryLanguage,
    additions,
    commits,
    archived: !!repo.archived,
    pushedAt: repo.pushed_at,
  };
  await saveCache(repo.full_name, data);
  return data;
}

async function fetchAllRepos() {
  const out = [];
  let page = 1;
  while (true) {
    const repos = await fetchJson(
      `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
    );
    if (!Array.isArray(repos) || repos.length === 0) break;
    out.push(...repos);
    if (repos.length < 100) break;
    page += 1;
  }
  return out;
}

async function isOutFresh() {
  try {
    const s = await stat(OUT);
    if (Date.now() - s.mtimeMs > OUT_TTL_MS) return false;
    // Also require non-stub content — a stub file shouldn't gate refresh.
    const m = JSON.parse(await readFile(OUT, 'utf8'));
    return m.source === 'github' && Array.isArray(m.buildings) && m.buildings.length > 0;
  } catch {
    return false;
  }
}

async function rebuildFromCache() {
  try {
    const files = await readdir(CACHE_DIR);
    const buildings = [];
    for (const f of files) {
      if (!f.startsWith('github-repo-') || !f.endsWith('.json')) continue;
      try {
        const data = JSON.parse(await readFile(`${CACHE_DIR}/${f}`, 'utf8'));
        if (data && data.id) buildings.push(data);
      } catch {
        // skip malformed cache entry
      }
    }
    return buildings;
  } catch {
    return [];
  }
}

async function main() {
  if (await isOutFresh()) {
    console.log('city-buildings: cache fresh (<6h), skipping fetch');
    return;
  }
  try {
    const repos = await fetchAllRepos();
    const filtered = repos.filter(
      (r) =>
        !r.fork &&
        r.default_branch &&
        (r.size ?? 0) >= MIN_REPO_SIZE_KB,
    );
    console.log(`city-buildings: ${filtered.length} repo(s) after filter (from ${repos.length})`);

    const buildings = [];
    for (const repo of filtered) {
      try {
        buildings.push(await enrichRepo(repo));
      } catch (err) {
        console.warn(`city-buildings: skip ${repo.full_name}: ${err.message}`);
      }
    }

    await write({
      source: 'github',
      fetchedAt: new Date().toISOString(),
      buildings,
    });
    console.log(`city-buildings: wrote ${buildings.length} building(s)`);
  } catch (err) {
    // On API failure (rate limit, no network), rebuild from per-repo cache
    // if we have any. Only fall back to an empty stub if we truly have nothing.
    const cached = await rebuildFromCache();
    if (cached.length > 0) {
      await write({
        source: 'github',
        fetchedAt: new Date().toISOString(),
        buildings: cached,
        note: 'rebuilt from local per-repo cache (live fetch failed)',
        reason: err.message,
      });
      console.warn(`city-buildings: ${err.message} — rebuilt ${cached.length} from cache`);
      return;
    }
    await write({
      source: 'stub',
      fetchedAt: new Date().toISOString(),
      reason: err.message,
      buildings: [],
    });
    console.warn(`city-buildings: ${err.message} — wrote stub fallback`);
  }
}

main().catch(async (err) => {
  await write({
    source: 'stub',
    reason: err.message,
    buildings: [],
  }).catch(() => {});
  console.warn(`city-buildings: fatal ${err.message}`);
});
