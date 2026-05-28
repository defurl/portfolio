import { useCityStore } from '../lib/stores/cityStore';
import styles from './BackToDesk.module.css';

// "back to overview" / "back to desk" affordance for the city scene. Reuses
// the BackToDesk module CSS for visual consistency. Visible whenever the
// city focus is not 'overview'. Click reverses the most recent zoom.
export function CityBack() {
  const focus = useCityStore((s) => s.focus);
  if (focus.mode === 'overview') return null;
  const label = '← back to overview';
  return (
    <button
      type="button"
      className={styles.back}
      onClick={() => useCityStore.getState().backToOverview()}
    >
      {label}
    </button>
  );
}
