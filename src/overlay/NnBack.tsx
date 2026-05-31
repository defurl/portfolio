import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../lib/stores/audioStore';
import { useTransitionStore } from '../lib/stores/transitionStore';
import { useSceneStore } from '../lib/stores/sceneStore';
import styles from './BackToDesk.module.css';

// Phase 4D — bottom-left affordance for /nn. Always reads "← back to desk"
// (NN is a single deep-dive; there is no in-scene district focus to back
// out of). Triggers a 300ms fade-to-black, swaps audio scene to desk, and
// navigates.
export function NnBack() {
  const navigate = useNavigate();
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
