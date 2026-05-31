import styles from './NnPlaceholder.module.css';

// CSS-only suspense fallback used while the NnRoute chunk loads. A pure
// concrete-corridor stand-in with a flickering ceiling shaft.
export function NnPlaceholder() {
  return (
    <div className={styles.shell} aria-hidden="true">
      <div className={styles.corridor}>
        <div className={styles.shaft} />
      </div>
      <p className={styles.label}>{'// inside the network · loading'}</p>
    </div>
  );
}
