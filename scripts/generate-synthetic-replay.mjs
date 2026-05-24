#!/usr/bin/env node
// Generates a synthetic Finnhub-shaped tape for Phase 2A.
//
// Algorithm:
//   - 30 tickers + SPY/QQQ/VIX
//   - Per ticker: mean-reverting price walk around a seed open price.
//     dP_t = -theta * (P_t - mu) * dt + sigma * P_t * sqrt(dt) * Z
//     where Z ~ N(0,1) via Box-Muller. theta=0.25, sigma drawn per-ticker.
//   - ~3% chance per tick of a "spike" (5-15bp jump in either direction).
//   - Volume is log-normal: exp(N(mu_v, sigma_v)) with mu_v scaled by hour.
//   - Tape covers a compressed 6.5h session, mapped to ~6.5min of wall clock
//     on replay (the adapter walks original offsets — we pack ticks tightly
//     so the file stays small but density is realistic).
//   - Target: ~5000 ticks across all symbols, weighted toward index symbols.
//
// Output: public/replay/synthetic.json, schema = ReplayDataset.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'replay', 'synthetic.json');

const TICKERS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AVGO', 'AMD', 'NFLX',
  'JPM', 'BAC', 'GS', 'MS', 'WFC',
  'XOM', 'CVX', 'COP',
  'JNJ', 'PFE', 'MRK',
  'V', 'MA', 'PYPL',
  'HD', 'WMT', 'COST', 'NKE', 'SBUX', 'DIS',
  'SPY', 'QQQ', 'VIX',
];

const SEED_PRICE = {
  AAPL: 188, MSFT: 422, NVDA: 905, GOOGL: 175, META: 510, AMZN: 188, TSLA: 175,
  AVGO: 1380, AMD: 158, NFLX: 645, JPM: 198, BAC: 38, GS: 445, MS: 95, WFC: 60,
  XOM: 118, CVX: 162, COP: 122, JNJ: 152, PFE: 27, MRK: 128, V: 275, MA: 460,
  PYPL: 64, HD: 345, WMT: 65, COST: 815, NKE: 92, SBUX: 78, DIS: 102,
  SPY: 532, QQQ: 458, VIX: 13.2,
};

// Per-ticker annualized vol; VIX uses a higher vol on itself.
function sigmaFor(ticker) {
  if (ticker === 'VIX') return 0.65;
  if (ticker === 'SPY' || ticker === 'QQQ') return 0.12;
  if (['NVDA', 'TSLA', 'AMD', 'NFLX'].includes(ticker)) return 0.45;
  return 0.28;
}

// Box-Muller
let spare = null;
function gauss() {
  if (spare !== null) {
    const v = spare;
    spare = null;
    return v;
  }
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  spare = r * Math.sin(theta);
  return r * Math.cos(theta);
}

const SESSION_MS = 6.5 * 60 * 60 * 1000;
const START_TS = Date.UTC(2026, 4, 22, 13, 30, 0); // 2026-05-22 09:30 ET
const TARGET_TICKS = 5000;

// Allocate ticks: SPY/QQQ/VIX get higher density.
function weightFor(t) {
  if (t === 'SPY' || t === 'QQQ') return 6;
  if (t === 'VIX') return 4;
  return 1;
}

const weights = TICKERS.map(weightFor);
const totalW = weights.reduce((a, b) => a + b, 0);

const state = {};
for (const t of TICKERS) {
  state[t] = { price: SEED_PRICE[t], openPrice: SEED_PRICE[t], sigma: sigmaFor(t), mu: SEED_PRICE[t] };
}

// Build per-ticker schedules: weighted count, ts uniformly in session.
const events = [];
for (let i = 0; i < TICKERS.length; i++) {
  const t = TICKERS[i];
  const count = Math.max(20, Math.round((weights[i] / totalW) * TARGET_TICKS));
  for (let k = 0; k < count; k++) {
    const ts = START_TS + Math.floor(Math.random() * SESSION_MS);
    events.push({ t, ts });
  }
}
events.sort((a, b) => a.ts - b.ts);

// Per-tick step in *years* — annualized sigma assumed. With ~150 ticks/symbol
// over 6.5h, fraction of a trading year per tick ≈ (6.5/6.5)/(252*150) ≈ 2.6e-5.
// We tighten to keep daily moves believable (target session range ≈ ±1–2% on SPY).
const TICK_DT_YEARS = 1 / (252 * 200);
const theta = 0.8; // stronger mean reversion keeps prices anchored

const ticks = [];
for (const ev of events) {
  const s = state[ev.t];
  const drift = -theta * (s.price - s.mu) * TICK_DT_YEARS;
  const diff = s.sigma * s.price * Math.sqrt(TICK_DT_YEARS) * gauss();
  let next = s.price + drift + diff;

  // Occasional spike (5-15bp).
  if (Math.random() < 0.03) {
    const bp = (5 + Math.random() * 10) / 10000;
    next *= 1 + (Math.random() < 0.5 ? -bp : bp);
  }

  // VIX clamped positive and tends to mean-revert harder.
  if (ev.t === 'VIX') next = Math.max(9, Math.min(60, next));
  else next = Math.max(0.01, next);

  s.price = next;
  const change = ((next - s.openPrice) / s.openPrice) * 100;
  const volume = Math.round(Math.exp(8 + 1.4 * gauss()));

  ticks.push({
    ticker: ev.t,
    price: Number(next.toFixed(ev.t === 'VIX' ? 2 : 2)),
    change: Number(change.toFixed(3)),
    volume: Math.max(1, volume),
    ts: ev.ts,
  });
}

const dataset = {
  datasetDate: '2026-05-22',
  captureMode: 'synthetic',
  tickers: TICKERS,
  ticks,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(dataset));
const bytes = JSON.stringify(dataset).length;
console.log(`wrote ${OUT}`);
console.log(`  ticks: ${ticks.length}`);
console.log(`  size:  ${(bytes / 1024).toFixed(1)} KB`);
