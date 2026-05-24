import { useEffect, useRef, useState } from 'react';
import { createReplayAdapter, type ReplayAdapter } from '../lib/data/replay';
import type { IndexSnapshot, MarketTick } from '../lib/data/types';

// Hidden verification route for Phase 2A Checkpoint A.
// Mounts the replay adapter, streams ticks to the DOM, prints stats after 10s.
// No analytics, no styling beyond a monospace block. Lives behind /debug/replay.

const DATASET_URL = '/replay/synthetic.json';
const TICK_BUFFER = 20;
const STATS_AFTER_MS = 10_000;

export function DebugReplayRoute() {
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  const [index, setIndex] = useState<IndexSnapshot | null>(null);
  const [stats, setStats] = useState<string | null>(null);
  const adapterRef = useRef<ReplayAdapter | null>(null);
  const tickCount = useRef(0);
  const seen = useRef(new Set<string>());
  const latestDir = useRef<string>('pending');

  useEffect(() => {
    const adapter = createReplayAdapter(DATASET_URL);
    adapterRef.current = adapter;
    const unsubTick = adapter.subscribe((t) => {
      tickCount.current += 1;
      seen.current.add(t.ticker);
      console.log('[tick]', t.ticker, t.price, t.change, t.ts);
      setTicks((prev) => [t, ...prev].slice(0, TICK_BUFFER));
    });
    const unsubIdx = adapter.subscribeIndex((s) => {
      console.log('[index]', s.direction, 'spy=' + s.spy.toFixed(2), 'vix=' + s.vix.toFixed(2));
      latestDir.current = s.direction;
      setIndex(s);
    });
    void adapter.start();

    const statsTimer = setTimeout(() => {
      const line = `stats @10s — ticks=${tickCount.current} uniqueTickers=${seen.current.size} direction=${latestDir.current}`;
      console.log(line);
      setStats(line);
    }, STATS_AFTER_MS);

    return () => {
      clearTimeout(statsTimer);
      unsubTick();
      unsubIdx();
      adapter.stop();
    };
  }, []);

  return (
    <main
      style={{
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--bg-void)',
        color: 'var(--ink-paper)',
        padding: '2rem',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '1rem', letterSpacing: '0.1em' }}>REPLAY · DEBUG</h1>
      <p style={{ color: 'var(--ink-muted)' }}>dataset: {DATASET_URL}</p>
      {index && (
        <p>
          index: dir={index.direction} spy={index.spy.toFixed(2)} qqq={index.qqq.toFixed(2)} vix=
          {index.vix.toFixed(2)}
        </p>
      )}
      {stats && <p style={{ color: 'var(--signal-amber)' }}>{stats}</p>}
      <table style={{ marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--ink-muted)' }}>
            <th style={{ textAlign: 'left', padding: '0.2rem 1rem 0.2rem 0' }}>ticker</th>
            <th style={{ textAlign: 'right', padding: '0.2rem 1rem 0.2rem 0' }}>price</th>
            <th style={{ textAlign: 'right', padding: '0.2rem 1rem 0.2rem 0' }}>chg%</th>
            <th style={{ textAlign: 'right', padding: '0.2rem 1rem 0.2rem 0' }}>vol</th>
            <th style={{ textAlign: 'right', padding: '0.2rem 0' }}>ts</th>
          </tr>
        </thead>
        <tbody>
          {ticks.map((t, i) => (
            <tr key={i} style={{ color: t.change >= 0 ? 'var(--data-green)' : 'var(--data-red)' }}>
              <td style={{ padding: '0.1rem 1rem 0.1rem 0' }}>{t.ticker}</td>
              <td style={{ textAlign: 'right', padding: '0.1rem 1rem 0.1rem 0' }}>{t.price.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '0.1rem 1rem 0.1rem 0' }}>{t.change.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '0.1rem 1rem 0.1rem 0' }}>{t.volume}</td>
              <td style={{ textAlign: 'right', padding: '0.1rem 0', color: 'var(--ink-muted)' }}>
                {new Date(t.ts).toISOString().slice(11, 19)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
