import { Canvas } from '@react-three/fiber';
import { DeskScene } from '../scenes/desk/DeskScene';
import { AudioToggle } from '../overlay/AudioToggle';
import { ProjectPanel } from '../overlay/ProjectPanel';
import { TerminalPanel } from '../overlay/TerminalPanel';
import { NotebookPanel } from '../overlay/NotebookPanel';
import { BackToDesk } from '../overlay/BackToDesk';
import { DeskAudio } from '../overlay/DeskAudio';
import { useSceneStore } from '../lib/stores/sceneStore';

// Desktop camera: seated first-person at z=2.2 / lookAt y=0.4, FOV 50°.
// Mobile camera (1.21): slightly raised, ~45° looking down at the desk,
// FOV reduced + framing widened so all eleven objects fit without scroll.
// The CameraRig takes over per-frame on focus changes; the rest pose is
// derived from these initial Canvas params plus the lookAt invocation.
export function DeskRoute() {
  const isMobile = useSceneStore(s => s.isMobile);

  const cameraProps = isMobile
    ? { position: [0, 1.6, 2.4] as [number, number, number], fov: 38 }
    : { position: [0, 1.15, 2.2] as [number, number, number], fov: 50 };
  const lookAt: [number, number, number] = isMobile ? [0, -0.05, -0.1] : [0, 0.4, 0];

  return (
    <>
      <Canvas
        camera={cameraProps}
        onCreated={({ camera }) => camera.lookAt(...lookAt)}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-void)' }}
      >
        <DeskScene />
      </Canvas>
      <ProjectPanel />
      <TerminalPanel />
      <NotebookPanel />
      <BackToDesk />
      <AudioToggle />
      <DeskAudio />
    </>
  );
}
