import { Canvas } from '@react-three/fiber';
import { DeskScene } from '../scenes/desk/DeskScene';
import { AudioToggle } from '../overlay/AudioToggle';

export function DeskRoute() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 1.2, 2.4], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-void)' }}
      >
        <DeskScene />
      </Canvas>
      <AudioToggle />
    </>
  );
}
