import type {
  FeedStatus,
  IndexDirection,
  IndexSnapshot,
  MarketTick,
  ReplayDataset,
} from './types';

// Replay-first data spine (Phase 2A, Option A).
//
// Loads a committed JSON tape and emits MarketTicks at their real-time
// offsets from the first tick. Index snapshots derive from the latest
// SPY/QQQ/VIX state and emit every ~1s. When the tape ends, the adapter
// loops with a fresh `loopStartTs` so consumers can detect the wrap.
//
// No network calls beyond the single dataset fetch. The interface mirrors
// what a live adapter will expose so the orchestrator can swap adapters
// without churn (Phase 5).

export interface ReplayStatus {
  readonly kind: 'replay';
  readonly datasetDate: string;
  readonly loopStartTs: number;
}

export interface ReplayAdapter {
  readonly status: () => Extract<FeedStatus, { kind: 'replay' }>;
  subscribe(handler: (tick: MarketTick) => void): () => void;
  subscribeIndex(handler: (snap: IndexSnapshot) => void): () => void;
  start(): Promise<void>;
  stop(): void;
}

const INDEX_INTERVAL_MS = 1000;
const DIRECTION_FLAT_BAND = 0.05; // ±0.05% on SPY counts as flat

function directionFor(spyChange: number): IndexDirection {
  if (spyChange > DIRECTION_FLAT_BAND) return 'up';
  if (spyChange < -DIRECTION_FLAT_BAND) return 'down';
  return 'flat';
}

export function createReplayAdapter(datasetUrl: string): ReplayAdapter {
  const tickHandlers = new Set<(tick: MarketTick) => void>();
  const indexHandlers = new Set<(snap: IndexSnapshot) => void>();

  let dataset: ReplayDataset | null = null;
  let loopStartTs = 0;
  let datasetDate = '';
  let running = false;
  let pendingTickTimer: ReturnType<typeof setTimeout> | null = null;
  let indexTimer: ReturnType<typeof setInterval> | null = null;

  // Latest seen prices for index aggregation.
  const latest = new Map<string, MarketTick>();

  function emitIndex() {
    const spy = latest.get('SPY');
    const qqq = latest.get('QQQ');
    const vix = latest.get('VIX');
    if (!spy || !qqq || !vix) return;
    const snap: IndexSnapshot = {
      spy: spy.price,
      qqq: qqq.price,
      vix: vix.price,
      direction: directionFor(spy.change),
      ts: Date.now(),
    };
    for (const h of indexHandlers) h(snap);
  }

  function scheduleNextTick(idx: number) {
    if (!running || !dataset) return;
    const ticks = dataset.ticks;
    if (ticks.length === 0) return;

    // Loop point: bump loopStartTs and restart at idx=0.
    if (idx >= ticks.length) {
      loopStartTs = Date.now();
      scheduleNextTick(0);
      return;
    }

    const first = ticks[0]!;
    const current = ticks[idx]!;
    const offsetFromFirst = current.ts - first.ts;
    const target = loopStartTs + offsetFromFirst;
    const delay = Math.max(0, target - Date.now());

    pendingTickTimer = setTimeout(() => {
      if (!running) return;
      // Re-issue the tick with a fresh wall-clock ts so downstream consumers
      // don't see stale tape timestamps. Original ts is preserved internally
      // for offset scheduling; we synthesize a "now" ts for the emission.
      const emitted: MarketTick = {
        ticker: current.ticker,
        price: current.price,
        change: current.change,
        volume: current.volume,
        ts: Date.now(),
      };
      latest.set(current.ticker, emitted);
      for (const h of tickHandlers) h(emitted);
      scheduleNextTick(idx + 1);
    }, delay);
  }

  return {
    status() {
      return { kind: 'replay', datasetDate, loopStartTs };
    },
    subscribe(handler) {
      tickHandlers.add(handler);
      return () => {
        tickHandlers.delete(handler);
      };
    },
    subscribeIndex(handler) {
      indexHandlers.add(handler);
      return () => {
        indexHandlers.delete(handler);
      };
    },
    async start() {
      if (running) return;
      const res = await fetch(datasetUrl);
      if (!res.ok) {
        throw new Error(`replay: dataset fetch failed (${res.status}) for ${datasetUrl}`);
      }
      dataset = (await res.json()) as ReplayDataset;
      datasetDate = dataset.datasetDate;
      loopStartTs = Date.now();
      running = true;
      scheduleNextTick(0);
      indexTimer = setInterval(emitIndex, INDEX_INTERVAL_MS);
    },
    stop() {
      running = false;
      if (pendingTickTimer) {
        clearTimeout(pendingTickTimer);
        pendingTickTimer = null;
      }
      if (indexTimer) {
        clearInterval(indexTimer);
        indexTimer = null;
      }
    },
  };
}
