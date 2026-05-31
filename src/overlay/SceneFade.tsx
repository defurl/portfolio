import { useTransitionStore } from '../lib/stores/transitionStore';
import styles from './SceneFade.module.css';

// Full-screen fade overlay driven by transitionStore.phase. Mounts at the App
// root so it sits above any Canvas + DOM overlay. Honors prefers-reduced
// motion implicitly via the CSS `transition` shorthand (browsers respect
// `prefers-reduced-motion: reduce` against custom durations only with extra
// CSS; for the fade it's small enough that we keep the duration as spec).
export function SceneFade() {
  const phase = useTransitionStore((s) => s.phase);
  return <div className={styles.fade} data-phase={phase} aria-hidden="true" />;
}
