import { useNavigate } from 'react-router-dom';
import { useCityStore } from '../lib/stores/cityStore';
import { useAudioStore } from '../lib/stores/audioStore';
import { useTransitionStore } from '../lib/stores/transitionStore';
import { useSceneStore } from '../lib/stores/sceneStore';
import styles from './BackToDesk.module.css';

// Context-aware bottom-left affordance:
//   - 'building' → "← back to district"
//   - 'district' → "← back to overview"
//   - 'overview' → "← back to desk" (navigates to / with a fade transition
//                   and re-targets the audio scene back to desk)
export function CityBack() {
  const focus = useCityStore((s) => s.focus);
  const backToDistrict = useCityStore((s) => s.backToDistrict);
  const backToOverview = useCityStore((s) => s.backToOverview);
  const navigate = useNavigate();

  if (focus.mode === 'building') {
    return (
      <button type="button" className={styles.back} onClick={backToDistrict}>
        ← back to district
      </button>
    );
  }
  if (focus.mode === 'district') {
    return (
      <button type="button" className={styles.back} onClick={backToOverview}>
        ← back to overview
      </button>
    );
  }
  // Overview → back to desk with a transition fade.
  const onClick = () => {
    const reduced = useSceneStore.getState().prefersReducedMotion;
    useAudioStore.getState().setScene('desk');
    if (reduced) {
      navigate('/');
      return;
    }
    useTransitionStore.getState().setPhase('fading-out');
    setTimeout(() => {
      useTransitionStore.getState().setPhase('black');
      navigate('/');
    }, 300);
  };
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      ← back to desk
    </button>
  );
}
