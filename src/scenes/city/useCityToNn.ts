import { useNavigate } from 'react-router-dom';
import { useCityStore } from '../../lib/stores/cityStore';
import { useAudioStore } from '../../lib/stores/audioStore';
import { useTransitionStore } from '../../lib/stores/transitionStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { findPlaced } from '../../lib/content/buildings';

// City → /nn — the "Neural Gateway building" transition.
//
// Timeline (per phase-4-prompt.md §4.19):
//   t=0     focus the gateway building (existing rig glides in close)
//           audioStore.setScene('nn')
//   t=1200  transition fade-out (300ms)
//   t=1500  navigate('/nn')
//
// Reduced motion: skip the glide + fade, navigate immediately.

const FADE_BEFORE_NAVIGATE_MS = 1200;
const NAVIGATE_AFTER_FADE_START_MS = 300;

export function useCityToNn(): (buildingId: string) => void {
  const navigate = useNavigate();
  return (buildingId: string) => {
    const reduced = useSceneStore.getState().prefersReducedMotion;
    useAudioStore.getState().setScene('nn');

    if (reduced) {
      navigate('/nn');
      return;
    }

    if (findPlaced(buildingId)) {
      useCityStore.getState().openBuilding(buildingId);
    }

    setTimeout(() => {
      useTransitionStore.getState().setPhase('fading-out');
    }, FADE_BEFORE_NAVIGATE_MS);

    setTimeout(() => {
      useTransitionStore.getState().setPhase('black');
      navigate('/nn');
    }, FADE_BEFORE_NAVIGATE_MS + NAVIGATE_AFTER_FADE_START_MS);
  };
}
