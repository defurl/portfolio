import { Canvas } from '@react-three/fiber';
import { DeskScene } from '../scenes/desk/DeskScene';
import { AudioToggle } from '../overlay/AudioToggle';
import { ProjectPanel } from '../overlay/ProjectPanel';
import { TerminalPanel } from '../overlay/TerminalPanel';
import { NotebookPanel } from '../overlay/NotebookPanel';
import { BackToDesk } from '../overlay/BackToDesk';
import { DeskAudio } from '../overlay/DeskAudio';

// Camera — pulled back to z=2.2 and tilted down by aiming the lookAt at
// y=0.4. FOV 50° per the design-spec. The CameraRig (inside DeskScene)
// takes over the camera each frame for click-to-focus glides; this initial
// pose is the rest position the rig glides back to.
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
      {/* DOM overlays — siblings of the Canvas. Each panel self-hides unless
          its own panel id is active in the interaction store. */}
      <ProjectPanel />
      <TerminalPanel />
      <NotebookPanel />
      <BackToDesk />
      <AudioToggle />
      {/* Renders nothing — bridges the audio store to the Tone.js engine. */}
      <DeskAudio />
    </>
  );
}
