// Phase 4C — chamber verification capture.
//
// Walks past the first chamber (left, after layer 0) so the entry-trigger
// fires, then captures the activation flash mid-decay; then walks into the
// chamber so the wall-panel is in view. Then warps the camera to the
// inference chamber (manual setCamera dev hook) and submits a prompt.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'captures/checkpoint-4c';
const VIEWPORT = { width: 1280, height: 800 };
const PORTS = process.env.CAPTURE_PORT
  ? [Number(process.env.CAPTURE_PORT)]
  : [5175, 5174, 5173];

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
    console.error('No dev server.');
    process.exit(1);
  }
  console.log(`capture: ${base}`);
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}/nn`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(1500);

  // 1. Initial corridor view.
  await page.screenshot({ path: `${OUT}/01-entry.png` });
  console.log('capture: 01-entry');

  // Walk to the first chamber's doorway (gap after layer 0 ~ z=-15.75).
  // Walk ≈ 17m forward.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3800);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/02-near-first-chamber.png` });
  console.log('capture: 02-near-first-chamber');

  // Turn left and walk in.
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-chamber-flash.png` });
  console.log('capture: 03-chamber-flash');
  await page.waitForTimeout(900); // let flash decay
  await page.screenshot({ path: `${OUT}/04-chamber-settled.png` });
  console.log('capture: 04-chamber-settled');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
