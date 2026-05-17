import styles from './LampPlaceholder.module.css';

// Suspense fallback shown while a lazy scene chunk loads.
// CSS-only — no JS animation, no R3F. ≤1KB.
export function LampPlaceholder() {
  return <div className={styles.room} role="status" aria-label="Loading" />;
}
