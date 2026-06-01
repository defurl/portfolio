import { Canvas } from '@react-three/fiber';
import { CityScene } from '../scenes/city/CityScene';
import { CityCameraRig } from '../scenes/city/CityCameraRig';
import { CityEntry } from '../scenes/city/CityEntry';
import { DeskData } from '../scenes/desk/DeskData';
import { AudioToggle } from '../overlay/AudioToggle';
import { DeskAudio } from '../overlay/DeskAudio';
import { FeedStatusBadge } from '../overlay/FeedStatusBadge';
import { CityBack } from '../overlay/CityBack';
import { CityBuildingPanel } from '../overlay/CityBuildingPanel';
import { CityNavOverlay } from '../overlay/CityNavOverlay';

// Phase 3A — city overview camera at (0, 20, 35), lookAt (0, 0, 0), FOV 35°.
// The narrower FOV (vs. desk's 50°) emphasizes scale: the city reads bigger.
//
// Data spine: `DeskData` provides the orchestrator + marketStore + session
// poll for any city consumer that reads from marketStore. The name is
// historical — it's the shared data bridge, not desk-specific. (Will rename
// to `MarketData` in a Phase 5 cleanup.)
//
// Audio: city scene bus is silent in Phase 2; Phase 3 keeps it that way and
// will wire scene crossfade properly during Checkpoint D entry transitions.

export function CityRoute() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 20, 35], fov: 35, near: 0.1, far: 500 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-void)' }}
      >
        <CityScene />
        <CityCameraRig />
      </Canvas>
      <FeedStatusBadge />
      <CityBack />
      <CityNavOverlay />
      <CityBuildingPanel />
      <CityEntry />
      <AudioToggle />
      <DeskAudio />
      <DeskData />
    </>
  );
}

