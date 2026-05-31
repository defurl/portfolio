import { Html } from '@react-three/drei';
import styles from './ChamberPanel.module.css';
import {
  CHAMBER_DEPTH,
  CHAMBER_HEIGHT,
  type ChamberSide,
} from './chambers';

// Phase 4C §4.15 — project wall-panel rendered inside a chamber via drei
// <Html>. Sits on the back wall facing the doorway, so a visitor entering
// the chamber reads the panel head-on.

interface ProjectLink {
  label: string;
  url: string;
}

export interface ChamberPanelProps {
  side: ChamberSide;
  eyebrow: string;
  title: string;
  thesis: string;
  links?: ProjectLink[];
}

export function ChamberPanel({ side, eyebrow, title, thesis, links }: ChamberPanelProps) {
  const dir = side === 'right' ? 1 : -1;
  // Position: just in front of the back wall slab, raised to chest height,
  // facing the doorway (rotation matches the back wall's orientation).
  return (
    <Html
      position={[(CHAMBER_DEPTH / 2 - 0.2) * dir, CHAMBER_HEIGHT * 0.55, 0]}
      rotation={[0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      transform
      occlude={false}
      distanceFactor={4}
      pointerEvents="auto"
    >
      <div className={styles.slab}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.thesis}>{thesis}</p>
        {links && links.length > 0 && (
          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label} →
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Html>
  );
}
