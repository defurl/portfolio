// Phase 4A NN scaffolding verification.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'captures/checkpoint-4a';
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
  await page.waitForTimeout(2000);

  // 1. Initial view down the corridor.
  await page.screenshot({ path: `${OUT}/01-entry.png` });
  console.log('capture: 01-entry');

  // Walk forward 3 seconds via keyboard.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-mid-hall.png` });
  console.log('capture: 02-mid-hall');

  // Drag to look right.
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 280, cy + 20, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-side-pillars.png` });
  console.log('capture: 03-side-pillars');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
