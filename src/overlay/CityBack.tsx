import { useCityStore } from '../lib/stores/cityStore';
import styles from './BackToDesk.module.css';

// Context-aware back affordance:
//   - in 'building' mode → "← back to district" (returns to parent district)
//   - in 'district' mode → "← back to overview"
//   - in 'overview' → hidden
// Preserves the user's exploration depth on close.
export function CityBack() {
  const focus = useCityStore((s) => s.focus);
  const backToDistrict = useCityStore((s) => s.backToDistrict);
  const backToOverview = useCityStore((s) => s.backToOverview);
  if (focus.mode === 'overview') return null;
  if (focus.mode === 'building') {
    return (
      <button type="button" className={styles.back} onClick={backToDistrict}>
        ← back to district
      </button>
    );
  }
  return (
    <button type="button" className={styles.back} onClick={backToOverview}>
      ← back to overview
    </button>
  );
}
