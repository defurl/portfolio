// `Ticker`, not `Symbol`, to avoid shadowing the global Symbol constructor.
export type Ticker = string;

export interface MarketTick {
  readonly ticker: Ticker;
  readonly price: number;
  readonly change: number; // pct vs prior close, signed
  readonly volume: number;
  readonly ts: number; // unix ms
}

export type FeedStatus =
  | { kind: 'live'; source: 'finnhub' }
  | { kind: 'rest'; source: 'alphavantage' }
  | { kind: 'replay'; datasetDate: string; loopStartTs: number }
  | { kind: 'error'; reason: string };

export type IndexDirection = 'up' | 'flat' | 'down';

export interface IndexSnapshot {
  readonly spy: number;
  readonly qqq: number;
  readonly vix: number;
  readonly direction: IndexDirection;
  readonly ts: number;
}

// Derived once by the orchestrator from replay wall-clock; consumers read it
// rather than recomputing `Date.now()`-based session windows themselves.
export type MarketSession =
  | 'pre-market'
  | 'open'
  | 'lunch'
  | 'close'
  | 'after-hours'
  | 'closed';

export interface SymbolMap {
  readonly tickers: ReadonlyArray<Ticker>;
  readonly districts: ReadonlyMap<Ticker, string>;
}

export interface ReplayDataset {
  readonly datasetDate: string;
  readonly captureMode: 'manual-finnhub-tape' | 'synthetic';
  readonly tickers: ReadonlyArray<Ticker>;
  readonly ticks: ReadonlyArray<MarketTick>;
}
