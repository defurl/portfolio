import { create } from 'zustand';
import type {
  FeedStatus,
  IndexSnapshot,
  MarketSession,
  MarketTick,
  Ticker,
} from '../data/types';

// The market data Zustand store.
//
// Subscribers should use selectors with shallow compare to avoid re-rendering
// the entire R3F tree on every tick. R3F frame loops MUST use
// `useMarketStore.getState()` inside the frame callback, never a React-level
// subscription.

interface MarketState {
  ticks: ReadonlyMap<Ticker, MarketTick>;
  index: IndexSnapshot | null;
  session: MarketSession;
  status: FeedStatus;
  applyTick(tick: MarketTick): void;
  applyIndex(snap: IndexSnapshot): void;
  setSession(session: MarketSession): void;
  setStatus(status: FeedStatus): void;
}

const INITIAL_STATUS: FeedStatus = { kind: 'error', reason: 'orchestrator not started' };

// Tick event side-channel — for consumers (audio engine, future visualizers)
// that need every tick event, not just the latest-per-ticker state. Storing
// every tick in Zustand state would force re-renders we don't want.
const tickListeners = new Set<(t: MarketTick) => void>();
export function subscribeTickEvent(h: (t: MarketTick) => void): () => void {
  tickListeners.add(h);
  return () => {
    tickListeners.delete(h);
  };
}
function emitTickEvent(t: MarketTick) {
  for (const l of tickListeners) l(t);
}

export const useMarketStore = create<MarketState>((set) => ({
  ticks: new Map(),
  index: null,
  session: 'closed',
  status: INITIAL_STATUS,
  applyTick(tick) {
    set((state) => {
      // Mutate a copy — Zustand's shallow selector compares references.
      const next = new Map(state.ticks);
      next.set(tick.ticker, tick);
      return { ticks: next };
    });
    emitTickEvent(tick);
  },
  applyIndex(snap) {
    set({ index: snap });
  },
  setSession(session) {
    set({ session });
  },
  setStatus(status) {
    set({ status });
  },
}));
