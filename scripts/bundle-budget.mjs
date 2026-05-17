// Fails CI if the initial JS payload exceeds the design-spec performance budget.
// Counts only the entry chunk + its sync imports — lazy chunks are excluded by design.
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET_KB = 200;
const DIST = 'dist/assets';

async function listJs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listJs(full)));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

async function readManifest() {
  try {
    const raw = await readFile('dist/.vite/manifest.json', 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function entryChunks(manifest) {
  if (!manifest) return null;
  const entries = Object.values(manifest).filter(c => c.isEntry);
  const chunks = new Set();
  const walk = chunk => {
    if (!chunk || chunks.has(chunk.file)) return;
    chunks.add(chunk.file);
    for (const imp of chunk.imports ?? []) walk(manifest[imp]);
  };
  entries.forEach(walk);
  return [...chunks].map(f => join('dist', f));
}

async function gzippedSize(file) {
  const buf = await readFile(file);
  return gzipSync(buf).length;
}

const main = async () => {
  await stat(DIST).catch(() => {
    throw new Error('dist/ not found — run `pnpm build` first');
  });

  const manifest = await readManifest();
  const files = entryChunks(manifest) ?? (await listJs(DIST));
  let total = 0;
  for (const f of files) total += await gzippedSize(f);

  const kb = total / 1024;
  const verdict = kb <= BUDGET_KB ? 'OK' : 'OVER BUDGET';
  console.log(`Initial JS gzipped: ${kb.toFixed(1)}KB (budget ${BUDGET_KB}KB) — ${verdict}`);
  if (kb > BUDGET_KB) process.exit(1);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
