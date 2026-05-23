import { useEffect, type ReactNode } from 'react';
import styles from './ScenePanel.module.css';

// Generic slide-in panel shell (Checkpoint B 1.13). Slides in from the right,
// 480px wide, full height. Rendered always — `open` toggles the slide via a
// CSS transform transition. Esc closes. The × button closes.

interface ScenePanelProps {
  open: boolean;
  /** Small-caps Departure Mono eyebrow at the top of the panel. */
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}

export function ScenePanel({ open, eyebrow, onClose, children }: ScenePanelProps) {
  // Esc closes whenever the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <aside
      className={styles.panel}
      data-open={open}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close panel"
      >
        ×
      </button>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
