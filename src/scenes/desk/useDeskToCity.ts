import { useNavigate } from 'react-router-dom';
import { useInteractionStore } from '../../lib/stores/interactionStore';
import { useAudioStore } from '../../lib/stores/audioStore';
import { useCityStore } from '../../lib/stores/cityStore';
import { useTransitionStore } from '../../lib/stores/transitionStore';
import { useSceneStore } from '../../lib/stores/sceneStore';

// The desk-to-city window-glide transition.
//
// Timeline (per phase-3-prompt.md §3.26):
//   t=0      camera focusObject('window') — existing CameraRig glide kicks off
//            audioStore.setScene('city') — engine crossfades over 1.5s
//   t=1500   transition fade-out (300ms) — overlay goes to black
//   t=1800   navigate('/city') with cityStore.entry='from-window'
//            CityRoute mounts; its own entry-glide takes over from here
//
// Under prefers-reduced-motion: skip the camera glide and the fade and just
// navigate immediately — accessibility-respectful path.

const FADE_BEFORE_NAVIGATE_MS = 1500;
const NAVIGATE_AFTER_FADE_START_MS = 300;

export function useDeskToCity(): () => void {
  const navigate = useNavigate();
  return () => {
    const reduced = useSceneStore.getState().prefersReducedMotion;
    useCityStore.getState().setEntry('from-window');
    useAudioStore.getState().setScene('city');

    if (reduced) {
      navigate('/city');
      return;
    }

    useInteractionStore.getState().focusObject('window', null);

    setTimeout(() => {
      useTransitionStore.getState().setPhase('fading-out');
    }, FADE_BEFORE_NAVIGATE_MS);

    setTimeout(() => {
      useTransitionStore.getState().setPhase('black');
      navigate('/city');
    }, FADE_BEFORE_NAVIGATE_MS + NAVIGATE_AFTER_FADE_START_MS);
  };
}
