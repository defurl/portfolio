import { useAudioStore } from '../lib/stores/audioStore';
import styles from './AudioToggle.module.css';

// Audio is OFF on first paint. This is the most prominent affordance —
// per design-spec.jsonc a11y rules, it must be unmistakable.
export function AudioToggle() {
  const enabled = useAudioStore(s => s.enabled);
  const toggle = useAudioStore(s => s.toggle);

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={enabled}
      onClick={toggle}
    >
      <span className={styles.dot} data-on={enabled} />
      <span className={styles.label}>
        {enabled ? 'sound on' : 'sound off'}
      </span>
    </button>
  );
}
