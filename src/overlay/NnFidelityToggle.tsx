import { useNnSettingsStore } from '../lib/stores/nnSettingsStore';
import styles from './NnFidelityToggle.module.css';

// U20 explicit fidelity scaler. Bottom-right, above the audio toggle.
// Persists only for the session (perf-safe default for repeat visitors).
export function NnFidelityToggle() {
  const highFi = useNnSettingsStore((s) => s.highFi);
  const toggle = useNnSettingsStore((s) => s.toggleHighFi);
  return (
    <button
      type="button"
      className={styles.toggle}
      data-active={highFi}
      onClick={toggle}
      aria-pressed={highFi}
    >
      {highFi ? 'hi-fi · on' : 'hi-fi · off'}
    </button>
  );
}
