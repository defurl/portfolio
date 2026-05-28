// Manual-run: render the /city overview at 1200×630 and commit the result
// to public/og-city.png. Owner runs this once when the city composition is
// final. Re-run when the city visual changes meaningfully.
//
// Usage:
//   1. pnpm dev   (in another terminal)
//   2. node scripts/generate-og-city.mjs
//
// Falls back gracefully if no dev server is found.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/og-city.png';
const PORTS = [5175, 5174, 5173];

async function findDev() {
  for (const port of PORTS) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { method: 'HEAD' });
      if (r.ok || r.status === 304) return `http://localhost:${port}`;
    } catch {
      // continue
    }
  }
  return null;
}

async function main() {
  const base = await findDev();
  if (!base) {
    console.error('No dev server on tried ports — start `pnpm dev` first.');
    process.exit(1);
  }
  await mkdir('public', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/city`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  // Force session 'open' so the sky reads bright; wait for sky lerp + entry.
  await page.evaluate(() => {
    // @ts-ignore - dev hook
    window.__market?.setSession('open');
  });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: OUT, omitBackground: false });
  await browser.close();
  console.log(`og: wrote ${OUT} (1200×630)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
