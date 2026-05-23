// Postbuild step — copies dist/index.html to dist/text/index.html so the
// static SPA fallback works under bare static-file servers (lhci, GitHub
// Pages, anything without rewrite rules). Vercel itself uses the rewrite
// rule in vercel.json in production; this script makes the build match
// that behaviour for local lhci runs too.
import { copyFile, mkdir, stat } from 'node:fs/promises';

const SRC = 'dist/index.html';
const DEST_DIR = 'dist/text';
const DEST = `${DEST_DIR}/index.html`;

const main = async () => {
  try {
    await stat(SRC);
  } catch {
    console.error(`prerender: ${SRC} not found — did the build run?`);
    process.exit(1);
  }
  await mkdir(DEST_DIR, { recursive: true });
  await copyFile(SRC, DEST);
  console.log(`prerender: ${SRC} → ${DEST}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
