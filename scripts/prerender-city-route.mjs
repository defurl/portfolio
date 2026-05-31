// Postbuild: emit dist/city/index.html with city-specific meta tags
// (og:image, og:title, og:description, og:url) so shares of the /city URL
// don't surface the desk's OG image. Mirrors prerender-text-route.mjs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SRC = 'dist/index.html';
const OUT = 'dist/city/index.html';

const SWAPS = [
  // og:image — desk → city
  {
    from: /<meta property="og:image" content="\/og\.png" \/>/,
    to: '<meta property="og:image" content="/og-city.png" />',
  },
  // og:title — desk → city
  {
    from: /<meta property="og:title" content="3am — a quant's workstation" \/>/,
    to: '<meta property="og:title" content="The voxel city — a portfolio that breathes with the market" />',
  },
  // og:description — desk → city (HTML may pretty-print across lines, so use multi-line + lazy regex)
  {
    from: /<meta\s+property="og:description"[\s\S]*?\/>/,
    to: '<meta property="og:description" content="Buildings are repos. Height is LOC, width is commits, color is language. The skyline pulses with live market direction." />',
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
