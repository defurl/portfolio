import { useNavigate } from 'react-router-dom';
import { useInteractionStore } from '../../lib/stores/interactionStore';
import { useAudioStore } from '../../lib/stores/audioStore';
import { useTransitionStore } from '../../lib/stores/transitionStore';
import { useSceneStore } from '../../lib/stores/sceneStore';

// Desk → /nn — the "step through the doorway" transition.
//
// Timeline (per phase-4-prompt.md §4.19):
//   t=0     camera focusObject('door') — existing CameraRig glides toward
//           the door spill (~2.2s)
//           audioStore.setScene('nn') — engine crossfades
//   t=1200  transition fade-out (300ms)
//   t=1500  navigate('/nn')
//
// Under prefers-reduced-motion: skip glide + fade, navigate immediately.

const FADE_BEFORE_NAVIGATE_MS = 1200;
const NAVIGATE_AFTER_FADE_START_MS = 300;

export function useDeskToNn(): () => void {
  const navigate = useNavigate();
  return () => {
    const reduced = useSceneStore.getState().prefersReducedMotion;
    useAudioStore.getState().setScene('nn');

    if (reduced) {
      navigate('/nn');
      return;
    }

    useInteractionStore.getState().focusObject('door', null);

    setTimeout(() => {
      useTransitionStore.getState().setPhase('fading-out');
    }, FADE_BEFORE_NAVIGATE_MS);

    setTimeout(() => {
      useTransitionStore.getState().setPhase('black');
      navigate('/nn');
    }, FADE_BEFORE_NAVIGATE_MS + NAVIGATE_AFTER_FADE_START_MS);
  };
}
