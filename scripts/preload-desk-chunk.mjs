// Postbuild step (perf) — inject <link rel="modulepreload"> tags for the
// DeskRoute chunk + its transitive sync deps into dist/index.html.
//
// Why: the `/` route's LCP is the WebGL canvas, which can't paint until the
// lazy DeskRoute chunk (R3F + three + drei + postprocessing, ~250KB gz)
// downloads and executes. Without a preload hint, the browser only learns
// about that chunk AFTER the entry script runs and triggers React.lazy.
// Adding modulepreload parallels the chunk download with the entry chunk,
// shaving 500–1500ms off LCP under realistic network conditions.
//
// Tradeoff: only `dist/index.html` is patched. `dist/text/index.html` is
// generated BEFORE this step runs (see scripts/prerender-text-route.mjs)
// so /text visitors don't waste bandwidth on chunks they'll never execute.
import { readFile, writeFile } from 'node:fs/promises';

const MANIFEST = 'dist/.vite/manifest.json';
const HTML = 'dist/index.html';

const main = async () => {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    console.warn('preload: manifest not found — skipping');
    return;
  }

  // Find the DeskRoute chunk entry by source path.
  const deskKey = Object.keys(manifest).find(k => k.endsWith('routes/DeskRoute.tsx'));
  if (!deskKey) {
    console.warn('preload: DeskRoute chunk not found in manifest — skipping');
    return;
  }

  // Walk the transitive sync `imports` closure. dynamicImports are NOT
  // included — those resolve on their own at runtime.
  const visited = new Set();
  const walk = key => {
    if (!key || visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) return;
    for (const imp of chunk.imports ?? []) walk(imp);
  };
  walk(deskKey);

  const files = [...visited]
    .map(k => manifest[k]?.file)
    .filter(Boolean)
    .map(f => `/${f}`);

  if (files.length === 0) {
    console.warn('preload: no files to preload');
    return;
  }

  const html = await readFile(HTML, 'utf8');
  const tags = files.map(f => `    <link rel="modulepreload" crossorigin href="${f}">`).join('\n');
  const updated = html.replace('</head>', `${tags}\n  </head>`);
  await writeFile(HTML, updated);
  console.log(`preload: injected ${files.length} modulepreload tag(s) into ${HTML}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
