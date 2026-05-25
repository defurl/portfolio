import { createReplayAdapter, type ReplayAdapter } from './replay';
import type { FeedStatus, IndexSnapshot, MarketTick } from './types';

// MarketOrchestrator — the single composition root for the data spine.
//
// Phase 2 (Option A): replay-first. Always loads the latest committed dataset
// in /public/replay/ and emits ticks + index snapshots from it. The interface
// reserves room for the live/REST variants — they're stubbed.
//
// TODO(phase-5): add finnhub-ws adapter and alphavantage-rest adapter, plus
// a fallback ladder live → rest → replay → error. The orchestrator's external
// surface (start/stop/onTick/onIndex/onStatus) does not change.
// See docs/03-architecture.md §9 ("Edge function — deferred") for the design
// of the live-data path and the security reasoning behind keeping it deferred.

export interface MarketOrchestrator {
  start(): Promise<void>;
  stop(): void;
  getStatus(): FeedStatus;
  onTick(handler: (tick: MarketTick) => void): () => void;
  onIndex(handler: (snap: IndexSnapshot) => void): () => void;
  onStatus(handler: (status: FeedStatus) => void): () => void;
}

// For now the latest dataset is the synthetic one; the owner's first capture
// will write 2026-MM-DD.json into /public/replay/ and this constant updates.
const LATEST_DATASET = '/replay/synthetic.json';

export function createMarketOrchestrator(): MarketOrchestrator {
  const tickHandlers = new Set<(t: MarketTick) => void>();
  const indexHandlers = new Set<(s: IndexSnapshot) => void>();
  const statusHandlers = new Set<(s: FeedStatus) => void>();

  let adapter: ReplayAdapter | null = null;
  let status: FeedStatus = { kind: 'error', reason: 'not started' };
  let unsubTick: (() => void) | null = null;
  let unsubIndex: (() => void) | null = null;

  function setStatus(next: FeedStatus) {
    status = next;
    for (const h of statusHandlers) h(next);
  }

  return {
    async start() {
      if (adapter) return;
      adapter = createReplayAdapter(LATEST_DATASET);
      unsubTick = adapter.subscribe((t) => {
        for (const h of tickHandlers) h(t);
      });
      unsubIndex = adapter.subscribeIndex((s) => {
        for (const h of indexHandlers) h(s);
      });
      try {
        await adapter.start();
        setStatus(adapter.status());
      } catch (err) {
        setStatus({ kind: 'error', reason: (err as Error).message });
      }
    },
    stop() {
      unsubTick?.();
      unsubIndex?.();
      unsubTick = null;
      unsubIndex = null;
      adapter?.stop();
      adapter = null;
      setStatus({ kind: 'error', reason: 'stopped' });
    },
    getStatus() {
      return status;
    },
    onTick(h) {
      tickHandlers.add(h);
      return () => {
        tickHandlers.delete(h);
      };
    },
    onIndex(h) {
      indexHandlers.add(h);
      return () => {
        indexHandlers.delete(h);
      };
    },
    onStatus(h) {
      statusHandlers.add(h);
      return () => {
        statusHandlers.delete(h);
      };
    },
  };
}

