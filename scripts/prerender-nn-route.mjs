// Postbuild: emit dist/nn/index.html with NN-specific meta tags so cold
// /nn URL entries surface the right OG/title/description. Mirrors
// prerender-city-route.mjs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SRC = 'dist/index.html';
const OUT = 'dist/nn/index.html';

const SWAPS = [
  // <title>
  {
    from: /<title>3am — a quant's workstation<\/title>/,
    to: '<title>Inside the Neural Network</title>',
  },
  // og:title — desk → nn
  {
    from: /<meta property="og:title" content="3am — a quant's workstation" \/>/,
    to: '<meta property="og:title" content="Inside the Neural Network — traverse a 4-layer transformer" />',
  },
  // og:description — desk → nn (multi-line tolerant)
  {
    from: /<meta\s+property="og:description"[\s\S]*?\/>/,
    to: '<meta property="og:description" content="Walk the architecture of a transformer encoder. Concrete halls, attention heads as pillars, projects in side chambers." />',
  },
];

const main = async () => {
  const html = await readFile(SRC, 'utf8');
  let out = html;
  let applied = 0;
  for (const { from, to } of SWAPS) {
    if (from.test(out)) {
      out = out.replace(from, to);
      applied += 1;
    }
  }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, out);
  console.log(`prerender: dist/index.html → ${OUT} (${applied}/${SWAPS.length} swaps applied)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
