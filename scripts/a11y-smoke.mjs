// Run axe-core against the built site for / and /text.
// Requires a running preview server on :4173 (CI: `pnpm preview --port 4173 &`).
import { chromium } from 'playwright';
import axeSource from 'axe-core';
import { readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4173';
const ROUTES = ['/', '/text'];

const axeScript = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  let failed = false;

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: axeScript });
    const results = await page.evaluate(async () => {
      return await window.axe.run({
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    });
    const critical = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    console.log(`${route}: ${critical.length} critical/serious a11y violations`);
    for (const v of critical) {
      console.log(`  - ${v.id}: ${v.help}`);
    }
    if (critical.length > 0) failed = true;
    await page.close();
  }

  await browser.close();
  if (failed) process.exit(1);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});

void axeSource; // keep import for resolution; axe is injected from file above.
