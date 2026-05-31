// Phase 4B verification: walk the corridor in both fidelity modes,
// capture neuron lights + token splines at a few positions.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'captures/checkpoint-4b';
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

  // 1. Standard mode at entry.
  await page.screenshot({ path: `${OUT}/01-standard-entry.png` });
  console.log('capture: 01-standard-entry');

  // Walk forward 2 seconds.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-standard-mid.png` });
  console.log('capture: 02-standard-mid');

  // 3. Flip on hi-fi.
  await page.locator('button:has-text("hi-fi")').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/03-hifi-mid.png` });
  console.log('capture: 03-hifi-mid');

  // 4. Walk further while hi-fi is on.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/04-hifi-deep.png` });
  console.log('capture: 04-hifi-deep');

  // 5. Drag-look right to frame the side-wall neuron lights.
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 260, cy, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/05-hifi-wall-neurons.png` });
  console.log('capture: 05-hifi-wall-neurons');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
