// Phase 3B verification capture — buildings populated from real GitHub data.
//
// Captures:
//   1. City overview at the spec camera (0, 20, 35) → (0, 0, 0)
//   2. Same with index.direction = up
//   3. Same with index.direction = down
//   4. Tilted overhead for district visibility
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT_DIR = 'captures/checkpoint-3b';
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
    console.error('No dev server — start `pnpm dev` first.');
    process.exit(1);
  }
  console.log(`capture: dev server at ${base}`);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.goto(`${base}/city`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(3000); // initial settle

  // Force session open so the sky lights up.
  await page.evaluate(() => window.__market?.setSession('open'));
  await page.waitForTimeout(7000);

  // 1. Spec overview.
  await page.evaluate(() => window.__city?.setCamera([0, 20, 35], [0, 0, 0]));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/01-overview.png` });
  console.log('capture: 01-overview');

  // 2. Direction up.
  await page.evaluate(() => window.__market?.setDirection('up'));
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT_DIR}/02-direction-up.png` });
  console.log('capture: 02-direction-up');

  // 3. Direction down.
  await page.evaluate(() => window.__market?.setDirection('down'));
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT_DIR}/03-direction-down.png` });
  console.log('capture: 03-direction-down');

  // 4. Higher tilt to show districts laid out.
  await page.evaluate(() => window.__market?.setDirection('flat'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__city?.setCamera([0, 60, 60], [0, 0, 0]));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/04-top-tilt.png` });
  console.log('capture: 04-top-tilt');

  // 5-8. Per-district close-ups.
  const districts = [
    { name: '05-trading', cam: [-22.5, 8, -5], target: [-22.5, 4, -22.5] },
    { name: '06-research', cam: [22.5, 8, -5], target: [22.5, 4, -22.5] },
    { name: '07-infrastructure', cam: [-22.5, 8, 40], target: [-22.5, 4, 22.5] },
    { name: '08-ml', cam: [22.5, 8, 40], target: [22.5, 4, 22.5] },
    { name: '09-lab', cam: [0, 8, 62], target: [0, 4, 45] },
  ];
  for (const d of districts) {
    await page.evaluate(
      ({ cam, target }) => window.__city?.setCamera(cam, target),
      { cam: d.cam, target: d.target },
    );
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT_DIR}/${d.name}.png` });
    console.log(`capture: ${d.name}`);
  }

  await browser.close();
  console.log(`capture: written to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
