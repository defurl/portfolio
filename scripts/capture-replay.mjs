#!/usr/bin/env node
// Capture a live Finnhub tape to public/replay/<date>.json.
//
// Owner-only. Run locally with FINNHUB_TOKEN in .env.local (gitignored).
// Not invoked from CI, predev, prebuild, or any package.json script.
//
// Usage:
//   FINNHUB_TOKEN=... node scripts/capture-replay.mjs [--duration=23400]
//   (default duration is 6.5h = 23400s)
//
// On SIGINT (Ctrl-C) or after `duration` elapses, writes the captured tape
// to public/replay/<YYYY-MM-DD>.json matching the ReplayDataset schema.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Node 22+ provides global WebSocket — no third-party dep.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env.local if present (we deliberately do not pull in dotenv as a dep).
const envPath = resolve(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const TOKEN = process.env.FINNHUB_TOKEN;
if (!TOKEN) {
  console.error('FINNHUB_TOKEN not set (env or .env.local).');
  process.exit(1);
}

const SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AVGO', 'AMD', 'NFLX',
  'JPM', 'BAC', 'GS', 'MS', 'WFC',
  'XOM', 'CVX', 'COP',
  'JNJ', 'PFE', 'MRK',
  'V', 'MA', 'PYPL',
  'HD', 'WMT', 'COST', 'NKE', 'SBUX', 'DIS',
];
// Index symbols: Finnhub exposes ETFs for these; VIX requires a different feed
// in production, but for capture we substitute ^VIX where supported.
const INDEX_SYMBOLS = ['SPY', 'QQQ'];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), 'true'];
  }),
);
const DURATION_MS = (Number(args.duration) || 6.5 * 60 * 60) * 1000;

const ws = new WebSocket(`wss://ws.finnhub.io?token=${TOKEN}`);
const ticks = [];
const opens = new Map();

ws.addEventListener('open', () => {
  for (const s of [...SYMBOLS, ...INDEX_SYMBOLS]) {
    ws.send(JSON.stringify({ type: 'subscribe', symbol: s }));
  }
  console.log(`subscribed to ${SYMBOLS.length + INDEX_SYMBOLS.length} symbols`);
});

ws.addEventListener('message', (ev) => {
  try {
    const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
    if (msg.type !== 'trade' || !Array.isArray(msg.data)) return;
    for (const t of msg.data) {
      if (!opens.has(t.s)) opens.set(t.s, t.p);
      const open = opens.get(t.s);
      const change = ((t.p - open) / open) * 100;
      ticks.push({
        ticker: t.s,
        price: t.p,
        change: Number(change.toFixed(3)),
        volume: t.v ?? 0,
        ts: t.t,
      });
    }
  } catch (err) {
    console.error('parse error:', err);
  }
});

ws.addEventListener('error', (ev) => {
  console.error('ws error:', ev);
});

function finish() {
  const date = new Date().toISOString().slice(0, 10);
  const out = resolve(ROOT, 'public', 'replay', `${date}.json`);
  mkdirSync(dirname(out), { recursive: true });
  const dataset = {
    datasetDate: date,
    captureMode: 'manual-finnhub-tape',
    tickers: [...SYMBOLS, ...INDEX_SYMBOLS, 'VIX'],
    ticks,
  };
  writeFileSync(out, JSON.stringify(dataset));
  console.log(`\nwrote ${out} (${ticks.length} ticks)`);
  process.exit(0);
}

process.on('SIGINT', finish);
setTimeout(finish, DURATION_MS);
