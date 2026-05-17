// `Ticker`, not `Symbol`, to avoid shadowing the global Symbol constructor.
export type Ticker = string;

export interface MarketTick {
  readonly symbol: Ticker;
  readonly price: number;
  readonly change: number; // pct vs prior close, signed
  readonly volume: number;
  readonly ts: number; // unix ms
}

export type FeedStatus =
  | { kind: 'live'; source: 'finnhub' }
  | { kind: 'rest'; source: 'alphavantage' }
  | { kind: 'replay'; datasetDate: string }
  | { kind: 'error'; reason: string };

export interface IndexSnapshot {
  readonly spy: number;
  readonly qqq: number;
  readonly vix: number;
  readonly direction: 'up' | 'flat' | 'down';
}
