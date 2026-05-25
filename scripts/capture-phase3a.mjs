// Phase 3A — city foundation visual evidence.
//
// Captures the empty city at three session states to demonstrate the sky
// shader is reading marketStore.session correctly:
//   - open         (cooler, brightest horizon)
//   - after-hours  (quietest, near BG_VOID)
//   - closed       (coldest, BG_VOID everywhere)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT_DIR = 'captures/checkpoint-3a';
const VIEWPORT = { width: 1280, height: 800 };
const PORTS = process.env.CAPTURE_PORT
  ? [Number(process.env.CAPTURE_PORT)]
  : [5175, 5174, 5173];

async function findDev() {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: 'HEAD' });
      if (res.ok || res.status === 304) return `http://localhost:${port}`;
    } catch {
      // try next
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
  console.log(`capture: dev server at ${base}`);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // Visit /city directly.
  await page.goto(`${base}/city`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(2000); // initial lerp settle

  // The spec overview camera (0, 20, 35) looking at (0,0,0) shows ground only
  // until buildings exist — no sky band visible. For the foundation-only
  // verification, tilt up to frame the sky-and-river horizon line.
  await page.evaluate(() => {
    // @ts-ignore
    window.__city?.setCamera([0, 8, 50], [0, 9, 0]);
  });
  await page.waitForTimeout(500);

  async function setSessionAndShoot(session, file) {
    await page.evaluate((s) => {
      // @ts-ignore - dev hook namespace
      window.__market?.setSession(s);
    }, session);
    // Sky lerps over 6s; wait 7s for it to settle.
    await page.waitForTimeout(7000);
    await page.screenshot({ path: `${OUT_DIR}/${file}` });
    console.log(`capture: ${file}`);
  }

  await setSessionAndShoot('open', '01-open.png');
  await setSessionAndShoot('after-hours', '02-after-hours.png');
  await setSessionAndShoot('closed', '03-closed.png');

  await browser.close();
  console.log(`capture: 3 PNG(s) written to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
