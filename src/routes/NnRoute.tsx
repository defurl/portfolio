import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { NnScene } from '../scenes/nn/NnScene';
import { NnCameraControls } from '../scenes/nn/NnCameraControls';
import { DeskData } from '../scenes/desk/DeskData';
import { AudioToggle } from '../overlay/AudioToggle';
import { DeskAudio } from '../overlay/DeskAudio';
import { FeedStatusBadge } from '../overlay/FeedStatusBadge';
import { NnFidelityToggle } from '../overlay/NnFidelityToggle';
import { NnBack } from '../overlay/NnBack';
import { useTransitionStore } from '../lib/stores/transitionStore';
import { useAudioStore } from '../lib/stores/audioStore';

// Phase 4A — Neural Network scaffolding (4D wired transitions + audio scene).
//
// Eye-level first-person camera (y=1.65m, FOV 60°). Lighting + hall geometry
// in NnScene; controls in NnCameraControls.
//
// Phase 4D additions:
//   - audioStore.scene := 'nn' on mount → engine crossfades to silence (the
//     nn bus is the placeholder until phase 4.20's drone engine lands).
//   - transitionStore: if inbound is 'black' / 'fading-out' (came from / or
//     /city), kick a fade-in next frame, mirror of DeskRoute's pattern.
//   - NnBack overlay → bottom-left "back to desk" with fade-out + navigate.
export function NnRoute() {
  useEffect(() => {
    useAudioStore.getState().setScene('nn');
    const phase = useTransitionStore.getState().phase;
    if (phase === 'black' || phase === 'fading-out') {
      requestAnimationFrame(() =>
        useTransitionStore.getState().setPhase('fading-in'),
      );
      const t = setTimeout(() => {
        useTransitionStore.getState().setPhase('idle');
      }, 1300);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      <Canvas
        camera={{ position: [0, 1.65, 2], fov: 60, near: 0.05, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-void)' }}
      >
        <NnScene />
        <NnCameraControls />
      </Canvas>
      <FeedStatusBadge />
      <NnFidelityToggle />
      <NnBack />
      <AudioToggle />
      <DeskAudio />
      <DeskData />
    </>
  );
}
