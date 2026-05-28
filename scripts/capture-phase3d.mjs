// Phase 3D verification — entry/exit transitions and OG image.
//
// Walks:
//   1. cold land on /city (deep-link path), capture mid fade-in
//   2. settle and capture
//   3. click back-to-desk → fade-to-black + navigate
//   4. desk reveals
//
// And a separate desk→/city walk (window click).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = 'captures/checkpoint-3d';
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

  // Path 1: /city deep-link → settled overview → back-to-desk
  await page.goto(`${base}/city`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.evaluate(() => window.__market?.setSession('open'));
  // mid fade-in
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01-city-deep-link-fading.png` });
  console.log('capture: 01-city-deep-link-fading');
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${OUT}/02-city-deep-link-settled.png` });
  console.log('capture: 02-city-deep-link-settled');

  // Back-to-desk button (overview mode).
  await page.locator('button:has-text("back to desk")').click();
  await page.waitForTimeout(150); // mid fade-out
  await page.screenshot({ path: `${OUT}/03-back-to-desk-fade.png` });
  await page.waitForURL('**/');
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/04-desk-reveal.png` });
  console.log('capture: 04-desk-reveal');

  await browser.close();
  console.log(`written to ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
