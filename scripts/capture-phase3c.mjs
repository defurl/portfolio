// Phase 3C verification — interactive city.
//
// Walks the camera through the full interaction flow:
//   1. overview (camera pans subtly with cursor in the corner)
//   2. district zoom (click a district label)
//   3. building hover (callout visible)
//   4. building click → panel open
//   5. back to overview (panel closed, camera reverses)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT_DIR = 'captures/checkpoint-3c';
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
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}/city`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.evaluate(() => window.__market?.setSession('open'));
  await page.waitForTimeout(7000); // let sky lerp

  // 1. Overview with cursor near corner — pan engages.
  await page.mouse.move(900, 250);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/01-overview-pan.png` });
  console.log('capture: 01-overview-pan');

  // 2. Programmatically zoom into trading district (mimics label click).
  await page.evaluate(() => {
    // @ts-ignore
    window.__city_zoomDistrict?.('trading');
  });
  await page.waitForTimeout(3000); // 2.5s glide + settle
  await page.screenshot({ path: `${OUT_DIR}/02-district-trading.png` });
  console.log('capture: 02-district-trading');

  // 3. Hover the first trading building via the dev hook.
  const firstId = await page.evaluate(() => {
    // @ts-ignore
    return window.__city_firstBuildingInDistrict?.('trading');
  });
  if (firstId) {
    await page.evaluate((id) => {
      // @ts-ignore
      window.__city_hoverBuilding?.(id);
    }, firstId);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT_DIR}/03-building-hover.png` });
    console.log(`capture: 03-building-hover (id=${firstId})`);

    // 4. Click the building → panel opens.
    await page.evaluate((id) => {
      // @ts-ignore
      window.__city_openBuilding?.(id);
    }, firstId);
    await page.waitForTimeout(2800); // glide + panel slide
    await page.screenshot({ path: `${OUT_DIR}/04-building-panel.png` });
    console.log('capture: 04-building-panel');
  } else {
    console.log('warn: no building id found for trading');
  }

  // 5. Close: back to overview.
  await page.evaluate(() => {
    // @ts-ignore
    window.__city_backToOverview?.();
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT_DIR}/05-back-to-overview.png` });
  console.log('capture: 05-back-to-overview');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
