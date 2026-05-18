import { Canvas } from '@react-three/fiber';
import { DeskScene } from '../scenes/desk/DeskScene';
import { AudioToggle } from '../overlay/AudioToggle';

// First-person seated camera per Phase 1.1: eyes at ~y=1.15 (head height for
// someone sitting), looking slightly down at the desk surface, FOV 50°.
// No camera controls in Checkpoint A — the camera is fixed.
export function DeskRoute() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 1.15, 1.8], fov: 50 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.8, 0)}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-void)' }}
      >
        <DeskScene />
      </Canvas>
      <AudioToggle />
    </>
  );
}
