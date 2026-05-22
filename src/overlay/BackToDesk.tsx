import { useInteractionStore } from '../lib/stores/interactionStore';
import styles from './BackToDesk.module.css';

// "Back to desk" affordance (Checkpoint B 1.12). Bottom-left, Departure Mono,
// amber on hover. Visible only once the camera has left its rest position
// (focus !== null). Clicking it reverses the glide and closes any panel.
export function BackToDesk() {
  const focus = useInteractionStore(s => s.focus);
  const returnToDesk = useInteractionStore(s => s.returnToDesk);

  if (focus === null) return null;

  return (
    <button type="button" className={styles.back} onClick={returnToDesk}>
      ← back to desk
    </button>
  );
}
