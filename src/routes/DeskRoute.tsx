import { Canvas } from '@react-three/fiber';
import { DeskScene } from '../scenes/desk/DeskScene';
import { AudioToggle } from '../overlay/AudioToggle';

// Camera — pulled back to z=2.2 and tilted down by aiming the lookAt at
// y=0.4 (revision adjustment). The lighting-plan's door-spill at z=+1.0 is
// outside the original (0,1.15,1.8)/lookAt(0,0.8,0) frustum; pulling back
// and aiming lower lands the spill pool inside the visible frame while
// keeping the back wall in shot. FOV 50° per the design-spec.
export function DeskRoute() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 1.15, 2.2], fov: 50 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.4, 0)}
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
