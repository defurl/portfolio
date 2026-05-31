import { Canvas } from '@react-three/fiber';
import { NnScene } from '../scenes/nn/NnScene';
import { NnCameraControls } from '../scenes/nn/NnCameraControls';
import { DeskData } from '../scenes/desk/DeskData';
import { AudioToggle } from '../overlay/AudioToggle';
import { DeskAudio } from '../overlay/DeskAudio';
import { FeedStatusBadge } from '../overlay/FeedStatusBadge';
import { NnFidelityToggle } from '../overlay/NnFidelityToggle';

// Phase 4A — Neural Network scaffolding.
// Eye-level first-person camera (y=1.65m, FOV 60°). Lighting + hall geometry
// are in NnScene; controls are in NnCameraControls (WASD/arrows + drag-look,
// clamped to corridor bounds).
//
// Cross-route data spine + audio toggle reuse the desk-built infrastructure
// (DeskData is the canonical market-data bridge, DeskAudio bridges the
// audio engine to the audio store). NN-specific audio scene routing lands
// in Checkpoint D.
export function NnRoute() {
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
      <AudioToggle />
      <DeskAudio />
      <DeskData />
    </>
  );
}
