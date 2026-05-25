// Phase 2B Checkpoint B — visual evidence capture.
//
// Captures desktop screenshots demonstrating:
//   1. REPLAY badge visible bottom-left at rest
//   2. Tooltip visible on hover
//   3. Window with session=open
//   4. Window with session=after-hours
//   5. Window with index.direction=up
//   6. Window with index.direction=down
//   7. REPLAY badge faded to 0 when a panel is focused
//
// Sessions and direction are injected by calling the marketStore actions via
// a small dev hook namespace exposed on window — see `__market` in DeskData.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT_DIR = 'captures/checkpoint-2b';
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
    console.error('No dev server on :5173 or :5174 — start `pnpm dev` first.');
    process.exit(1);
  }
  console.log(`capture: dev server at ${base}`);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(2500); // let lerp settle

  // 1. Rest — replay badge visible bottom-left.
  await page.screenshot({ path: `${OUT_DIR}/01-rest-with-badge.png` });
  console.log('capture: 01-rest-with-badge');

  // 2. Hover the badge → tooltip.
  const badge = page.locator('div[aria-label*="replay"]').first();
  await badge.hover();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/02-badge-tooltip.png` });
  console.log('capture: 02-badge-tooltip');
  await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);

  async function setSession(session) {
    await page.evaluate((s) => {
      // @ts-ignore - dev hook
      window.__market?.setSession(s);
    }, session);
    await page.waitForTimeout(2000);
  }
  async function setDirection(dir) {
    await page.evaluate((d) => {
      // @ts-ignore - dev hook
      window.__market?.setDirection(d);
    }, dir);
    await page.waitForTimeout(2000);
  }

  // The window lives on the right side wall — at the rest pose it's out of
  // frame. Glide to the window focus pose so the indicator is centred.
  await page.evaluate(() => {
    // @ts-ignore - interactionStore exposes focusObject via dev hook
    window.__market?.focus('window');
  });
  await page.waitForTimeout(2500); // camera glide is 2200ms

  // Full-frame from here on; window fills most of the view at focus pose.

  await setSession('open');
  await page.screenshot({ path: `${OUT_DIR}/03-window-open.png`});
  console.log('capture: 03-window-open');

  await setSession('after-hours');
  await page.screenshot({ path: `${OUT_DIR}/04-window-after-hours.png`});
  console.log('capture: 04-window-after-hours');

  // Reset session for direction shots.
  await setSession('open');

  await setDirection('up');
  await page.screenshot({ path: `${OUT_DIR}/05-window-up.png`});
  console.log('capture: 05-window-up');

  await setDirection('down');
  await page.screenshot({ path: `${OUT_DIR}/06-window-down.png`});
  console.log('capture: 06-window-down');

  // 7. Focus a panel — badge fades.
  await setDirection('flat');
  // Return to desk first, then focus Monitor 1 (opens the projects panel).
  await page.evaluate(() => {
    // @ts-ignore
    window.__market?.focus(null);
  });
  await page.waitForTimeout(2400);
  await page.evaluate(() => {
    // @ts-ignore
    window.__market?.focus('monitor1');
  });
  await page.waitForTimeout(2600); // glide
  await page.screenshot({ path: `${OUT_DIR}/07-panel-open-badge-faded.png` });
  console.log('capture: 07-panel-open-badge-faded');

  await browser.close();
  console.log(`capture: 7 PNG(s) written to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
