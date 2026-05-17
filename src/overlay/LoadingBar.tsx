import styles from './LoadingBar.module.css';

export function LoadingBar() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-label="Loading scene">
      <div className={styles.bar} />
    </div>
  );
}
