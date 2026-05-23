// Automated state-capture for Checkpoint C review (1.26).
// Per the PM's "visual evidence" rule, the WAIT block needs at minimum:
//   1. 375px viewport at rest
//   2. tap-to-label state (single tap on Monitor 1)
//   3. open full-screen panel state (second tap activates)
//   4. audio toggle area (top-right on mobile)
//
// Captures land in `captures/checkpoint-c/`. Owner can attach the four PNGs
// to the WAIT review without needing to manually screenshot the browser.
//
// Usage: start the dev server (`pnpm dev`) in one terminal, then
//        `pnpm capture:states` in another. The script discovers whichever
//        port vite landed on (5173 or 5174) and bails clearly if neither
//        is up.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT_DIR = 'captures/checkpoint-c';
const VIEWPORT = { width: 375, height: 812 }; // iPhone-ish mobile target
const PORTS = [5173, 5174];

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
    console.error('No dev server on :5173 or :5174 — start `pnpm dev` first.');
    process.exit(1);
  }
  console.log(`capture: dev server at ${base}`);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();

  await page.goto(base, { waitUntil: 'networkidle' });
  // Wait for the WebGL canvas to actually render a frame.
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(800);

  // 1. At rest.
  await page.screenshot({ path: `${OUT_DIR}/01-rest.png` });
  console.log('capture: 01-rest');

  // 2. Tap-to-label on Monitor 1. The monitors live in 3D — we tap a screen
  //    point roughly where Monitor 1 sits at the mobile camera framing.
  //    The mobile camera (0, 1.6, 2.4) looking at (0, -0.05, -0.1) puts
  //    Monitor 1 (world [-0.3, 0.306, -0.4]) at approximately viewport
  //    (40% × W, 45% × H).
  const m1x = VIEWPORT.width * 0.4;
  const m1y = VIEWPORT.height * 0.45;
  await page.touchscreen.tap(m1x, m1y);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT_DIR}/02-tap-label.png` });
  console.log('capture: 02-tap-label');

  // 3. Second tap → activate → panel slides up.
  await page.touchscreen.tap(m1x, m1y);
  await page.waitForTimeout(1200); // wait for the panel slide
  await page.screenshot({ path: `${OUT_DIR}/03-panel-open.png` });
  console.log('capture: 03-panel-open');

  // 4. Audio toggle area — close the panel first, then capture the
  //    top-right corner of the viewport.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${OUT_DIR}/04-audio-toggle.png`,
    clip: { x: VIEWPORT.width - 150, y: 0, width: 150, height: 80 },
  });
  console.log('capture: 04-audio-toggle');

  await browser.close();
  console.log(`capture: 4 PNG(s) written to ${OUT_DIR}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
