// Single source of truth for the design-spec color guard.
// Bans hex literals approximating purple / indigo / pink / pure-white from
// every TS/TSX/CSS file under src/. Comment-line exceptions are not honored —
// the goal is to keep the palette pristine, not to enable workarounds.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const BANNED_HEX = /#(?:fff(?:fff)?|[a-f0-9]*(?:6366f1|8b5cf6|a855f7|ec4899|d946ef|7c3aed)[a-f0-9]*)/gi;
const ROOTS = ['src'];
const EXTS = new Set(['.ts', '.tsx', '.css']);

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else {
      const dot = entry.name.lastIndexOf('.');
      if (dot >= 0 && EXTS.has(entry.name.slice(dot))) out.push(full);
    }
  }
  return out;
}

function findMatches(content) {
  const hits = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    BANNED_HEX.lastIndex = 0;
    let m;
    while ((m = BANNED_HEX.exec(lines[i])) !== null) {
      hits.push({ line: i + 1, col: m.index + 1, match: m[0] });
    }
  }
  return hits;
}

const main = async () => {
  let files = [];
  for (const root of ROOTS) {
    try {
      await stat(root);
      await walk(root, files);
    } catch {
      // root missing — skip silently
    }
  }

  let total = 0;
  for (const f of files) {
    const content = await readFile(f, 'utf8');
    const hits = findMatches(content);
    for (const h of hits) {
      console.error(`${relative(process.cwd(), f)}:${h.line}:${h.col} → ${h.match}`);
      total++;
    }
  }

  if (total > 0) {
    console.error(`\n${total} banned color literal(s) found. See design-spec.jsonc anti_patterns.`);
    process.exit(1);
  }
  console.log(`lint-colors: clean (${files.length} files scanned)`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
