import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import styles from './InferenceChamber.module.css';
import {
  CHAMBER_HEIGHT,
  type ChamberSide,
} from './chambers';

// Phase 4C §4.16 — U24 live transformer inference demo.
//
// Visitor types a short sentence; on submit, a synthetic forward pass runs:
// 4 layers each "process" the input over ~600ms, drawing attention-weight
// lines between input tokens in an SVG grid. Weights are computed
// deterministically from the input string + layer index (a faked attention
// pattern that nonetheless looks plausible: stronger pairs decay with
// token distance, plus a layer-specific bias toward different positions).
//
// The simulation is purely visual — no model runs, no fetch. Per §4.16 the
// React tree is isolated from the R3F canvas: state lives in this component
// and never reaches the scene store.

const LAYERS = 4;
const LAYER_DURATION_MS = 600;
const MAX_TOKENS = 8;

interface AttnWeight {
  from: number;
  to: number;
  weight: number; // 0..1
}

// Faked attention pattern: weight between token i and j combines a
// distance-decay kernel and a per-layer position bias.
function computeAttention(tokens: string[], layer: number): AttnWeight[] {
  const n = tokens.length;
  const out: AttnWeight[] = [];
  // Deterministic hash of the input for stable visuals on the same prompt.
  const seed = tokens.join(' ').length + layer * 17;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dist = Math.abs(i - j);
      const decay = Math.exp(-dist / 2.5);
      // Layer bias: early layers attend locally, deep layers globally.
      const layerSpread = 1 + layer * 0.6;
      const layerKernel = Math.exp(-dist / (2 * layerSpread));
      // Per-token noise from the seed.
      const noise = (Math.sin((i + 1) * (j + 1) * seed * 0.137) + 1) / 2;
      const w = (decay * 0.5 + layerKernel * 0.3 + noise * 0.2);
      if (w > 0.12) out.push({ from: i, to: j, weight: Math.min(1, w) });
    }
  }
  return out;
}

interface InferenceChamberProps {
  side: ChamberSide;
}

export function InferenceChamber({ side }: InferenceChamberProps) {
  const dir = side === 'right' ? 1 : -1;
  const [prompt, setPrompt] = useState('The market moves on subtle anomalies');
  const [tokens, setTokens] = useState<string[]>(() =>
    'The market moves on subtle anomalies'.split(' ').slice(0, MAX_TOKENS),
  );
  const [currentLayer, setCurrentLayer] = useState(-1); // -1 = idle
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recompute attention weights for the visible layer (or final).
  const visibleLayer = currentLayer === -1 ? LAYERS - 1 : currentLayer;
  const weights = useMemo(
    () => computeAttention(tokens, visibleLayer),
    [tokens, visibleLayer],
  );

  // Submit handler: tokenize, kick off the per-layer animation.
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = prompt
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, MAX_TOKENS);
    if (t.length < 2) return;
    setTokens(t);
    setCurrentLayer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    let layer = 0;
    timerRef.current = setInterval(() => {
      layer += 1;
      if (layer >= LAYERS) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCurrentLayer(-1);
        return;
      }
      setCurrentLayer(layer);
    }, LAYER_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // SVG layout for the attention grid.
  const svgW = 480;
  const svgH = 240;
  const padX = 30;
  const padY = 40;
  const n = tokens.length;
  const tokenX = (i: number) =>
    n <= 1 ? svgW / 2 : padX + ((svgW - 2 * padX) * i) / (n - 1);
  const topY = padY;
  const botY = svgH - padY;

  return (
    <Html
      position={[0, CHAMBER_HEIGHT * 0.55, 0]}
      rotation={[0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      transform
      occlude={false}
      distanceFactor={5}
      pointerEvents="auto"
    >
      <div className={styles.slab}>
        <p className={styles.eyebrow}>{'// inference · u24'}</p>
        <h2 className={styles.title}>attention head</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="type a sentence…"
            maxLength={80}
          />
          <button type="submit" className={styles.submit}>
            run →
          </button>
        </form>
        <svg className={styles.viz} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Input tokens (top row) */}
          {tokens.map((_, i) => (
            <g key={`top-${i}`}>
              <circle cx={tokenX(i)} cy={topY} r={4} fill="var(--signal-amber)" />
            </g>
          ))}
          {/* Output tokens (bottom row) */}
          {tokens.map((_, i) => (
            <g key={`bot-${i}`}>
              <circle cx={tokenX(i)} cy={botY} r={4} fill="var(--voxel-glow)" />
            </g>
          ))}
          {/* Attention lines */}
          {weights.map((w, idx) => (
            <line
              key={idx}
              x1={tokenX(w.from)}
              y1={topY}
              x2={tokenX(w.to)}
              y2={botY}
              stroke="var(--voxel-glow)"
              strokeWidth={0.5 + w.weight * 2.2}
              strokeOpacity={0.15 + w.weight * 0.7}
            />
          ))}
        </svg>
        <div className={styles.tokens}>
          {tokens.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <p className={styles.status}>
          {currentLayer >= 0
            ? `// layer ${currentLayer + 1} / ${LAYERS} processing…`
            : `// idle — showing layer ${LAYERS} attention`}
        </p>
      </div>
    </Html>
  );
}
