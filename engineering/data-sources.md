# engineering/data-sources.md

> How the site gets market data, in what order, and how it survives every flavor of failure. Read this before touching anything in `src/lib/data/` or `api/feed.ts`.

## The three sources

| Tier | Source | Role | Latency | Cost |
|---|---|---|---|---|
| Primary | **Finnhub WebSocket** | Real-time-ish trade ticks | sub-second | Free tier |
| Fallback | **Alpha Vantage REST** | 60s-polled snapshots | ~minute | Free tier |
| Last resort | **Cached replay JSON** | A real prior-day session, replayed at real-time | n/a | $0 |

The orchestrator walks this ladder. The visitor never sees a stalled scene; only the source label in the corner changes.

## Why this ladder

- Finnhub WS is the only free option that's interactive enough to make the city *feel* live.
- Alpha Vantage is unreliable on free tier (5 req/min) — fine as a degraded mode, not a primary.
- The replay is the most important of the three: it's what guarantees the site never looks broken outside US market hours, which is most of the time.

## Symbols we care about

(See `content/symbols.json` for the canonical list — keep these in lockstep.)

- **Index proxies:** `SPY`, `QQQ`, `^VIX` (or `VXX` if `^` is unavailable on free tier)
- **District anchors** (~6–10 per district, ~30 total):
  - Research district: large-cap AI/research-coded names (`NVDA`, `GOOGL`, `MSFT`, `META`, `PLTR`, …)
  - Trading district: financials (`JPM`, `GS`, `MS`, `BLK`, `COIN`, …)
  - Infrastructure district: cloud/hardware (`AMZN`, `AAPL`, `AMD`, `AVGO`, `ORCL`, …)

Choosing 30 means each instanced building draw call covers a tractable per-frame update set.

## Data shape

All sources normalize to:

```ts
// src/lib/data/types.ts
export type Ticker = string; // 'NVDA'

export interface MarketTick {
  symbol: Ticker;
  price: number;          // last trade
  change: number;         // pct change vs prior close, signed
  volume: number;         // cumulative session volume
  ts: number;             // unix ms
}

export type FeedStatus =
  | { kind: 'live'; source: 'finnhub' }
  | { kind: 'rest'; source: 'alphavantage' }
  | { kind: 'replay'; datasetDate: string }   // 'YYYY-MM-DD'
  | { kind: 'error'; reason: string };

export interface IndexSnapshot {
  spy: number;   // pct change
  qqq: number;
  vix: number;   // absolute level
  direction: 'up' | 'flat' | 'down';
}
```

## Fallback ladder (state machine)

```
            ┌────────────────┐
   boot ──▶ │  finnhub-ws    │
            └──┬─────────────┘
               │  silent 15s OR error
               ▼
            ┌────────────────┐
            │  alpha-rest    │
            └──┬─────────────┘
               │  3 consecutive failures OR 429
               ▼
            ┌────────────────┐
            │    replay      │  ◀── also entered immediately if market closed
            └────────────────┘
```

Transitions are debounced by 2s to avoid flapping. A successful re-connect higher on the ladder demotes back to the live source after 30s of stability.

## Market-hours detection

```
NY market open:  09:30 ET, Mon–Fri
NY market close: 16:00 ET, Mon–Fri
Pre-market:      04:00–09:30 ET
After-hours:     16:00–20:00 ET
Closed:          weekends, US market holidays
```

Detection uses the IANA timezone `America/New_York` and a small hard-coded US-holidays list refreshed yearly. When `closed`, orchestrator boots in replay mode and skips both live sources.

## Replay dataset

- One JSON file per dataset under `public/replay/`, named `YYYY-MM-DD.json`.
- Schema:

```jsonc
{
  "date": "2025-10-15",
  "marketHours": { "open": 1729000200000, "close": 1729023600000 },
  "ticks": [
    { "symbol": "NVDA", "price": 142.18, "change": 0.012, "volume": 1234567, "ts": 1729000202100 },
    // …chronological…
  ],
  "indexSamples": [
    { "ts": 1729000200000, "spy": 0.0, "qqq": 0.0, "vix": 18.4 },
    // …every 60s…
  ]
}
```

- Generated offline by `engineering/scripts/snapshot-replay.ts` (TBD), which records a full trading session and writes the JSON. Run once a quarter (or after a notable market day worth preserving).
- The orchestrator streams replay ticks at real-time playback speed, looping at end-of-session with a 5s pause.

## Edge function — `/api/feed`

Runs on Vercel Edge runtime. The primary live-data path is **signed-URL handoff**: the edge function stays out of the WebSocket hot path entirely. (Vercel Edge isn't built for long-lived WS pipes on the free tier; treating it as a proxy is a known foot-gun.)

Responsibilities:

- **Auth boundary:** `FINNHUB_API_KEY` and `ALPHAVANTAGE_API_KEY` come from env vars; never echoed to the client unsigned.
- **`/api/feed/token`** (primary): mints a short-lived (≤60s TTL) signed URL the browser uses to open a direct WSS to Finnhub. Per-IP rate-limit on this endpoint blocks casual key extraction. Key rotation cadence: deferred — see architecture D6.
- **`/api/feed/rest?symbol=X`**: REST proxy to Alpha Vantage with a 60s in-memory cache; returns `429 Retry-After` on upstream cap, which trips the fallback ladder.
- **`/api/feed/replay`**: returns the current replay dataset's manifest. The dataset JSON itself is served as a static asset from `public/replay/`.

**Fallback variant — edge WS proxy:** if the signed-URL approach proves untenable (Finnhub policy change, key abuse, etc.), pivot to a true edge WS upgrade that pipes Finnhub → browser. This is a contingency, not the default. The fallback ladder state machine doesn't change either way.

## Rate-limit discipline

- Finnhub free tier: per their docs, generous on WS but capped on subscribed symbols. We subscribe to ~30 max.
- Alpha Vantage free tier: 5 requests / minute. The REST adapter throttles below that and prioritizes the index proxies.
- The edge function caches REST responses 60s in-memory.
- Per-IP soft cap: 1 WS connection, 30 REST hits/min. On exceed → `429` → client falls back to replay.

## Privacy

- The edge function logs: timestamp, endpoint, status, latency. **No IP, no user-agent persisted.**
- No third-party analytics on data calls.
- The client does not include any identifying header beyond what fetch sends by default.

## How rendering consumes the feed

- Renderers do **not** subscribe to the raw stream — they subscribe to a Zustand selector view over `marketStore`.
- City buildings update at most every 100ms (10Hz visual smoothing); ticks aggregate into the store at raw rate.
- The audio layer subscribes separately and may update at a slower envelope (e.g., bass tempo changes are smoothed over 2s).

## Testing

- Unit tests for the orchestrator's state machine (`orchestrator.test.ts`): assert transitions on each trigger.
- Unit tests for the replay player: assert playback speed and looping.
- A `dev` mode override (`?feed=replay`, `?feed=rest`, `?feed=finnhub`) forces a specific tier for manual testing.

## What we deliberately are NOT doing

- No paid data tier — if the free tiers collapse, we accept replay-only mode.
- No order-book depth, no Level 2. Trades + index snapshots are enough for the metaphor.
- No crypto by default (different vibe; revisit post-v1).
- No options chain.
- No news feed — the city *is* the news.
