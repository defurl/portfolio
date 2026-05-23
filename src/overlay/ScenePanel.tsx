import { useEffect, useRef, type ReactNode } from 'react';
import { useSceneStore } from '../lib/stores/sceneStore';
import styles from './ScenePanel.module.css';

// Generic slide-in panel shell (Checkpoint B 1.13 + 1.22 mobile variant).
// - Desktop: 480px right-side slide-in, slides via translateX.
// - Mobile: full-screen, slides via translateY (from below), closes via
//   the × button OR a swipe-down gesture (a simple pointer-y delta).
// Esc closes on both.

interface ScenePanelProps {
  open: boolean;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}

const SWIPE_CLOSE_THRESHOLD_PX = 80;

export function ScenePanel({ open, eyebrow, onClose, children }: ScenePanelProps) {
  const isMobile = useSceneStore(s => s.isMobile);
  const startY = useRef<number | null>(null);

  // Esc closes whenever the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Swipe-down close on mobile. Pointer-event-based — no library.
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!isMobile) return;
    startY.current = e.clientY;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isMobile || startY.current === null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy > SWIPE_CLOSE_THRESHOLD_PX) onClose();
  };

  return (
    <aside
      className={styles.panel}
      data-open={open}
      data-mobile={isMobile}
      aria-hidden={!open}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close panel">
        ×
      </button>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
