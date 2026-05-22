import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { BG_VOID, INK_GHOST } from '../../../lib/style/colors';
import { useInteractionStore } from '../../../lib/stores/interactionStore';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import phoneStyles from './PhoneScreen.module.css';

// Phone — contact (1.17). Face-down on the desk; clicking it (via the
// InteractiveObject wrapper in DeskScene) focuses the camera and flips the
// phone face-up to reveal a mailto link on the screen.
//
// The flip is a 180° rotation about the phone's own centre-line (Z axis) so
// it turns in place. `flipped` is derived from the interaction store's focus.

interface PhoneProps {
  position: [number, number, number];
}

const CONTACT_EMAIL = 'amorelyn.work@gmail.com';

const W = 0.075;
const D = 0.15;
const H = 0.008;
const FLIP_MS = 700;

export function Phone({ position }: PhoneProps) {
  const flipGroup = useRef<Group>(null);
  const progress = useRef(0); // 0 = face-down, 1 = face-up
  const flipped = useInteractionStore(s => s.focus === 'phone');

  useFrame((_, dt) => {
    if (!flipGroup.current) return;
    const goal = flipped ? 1 : 0;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) {
      progress.current = goal;
    } else {
      const step = (dt * 1000) / FLIP_MS;
      progress.current += Math.sign(goal - progress.current) * step;
      progress.current = Math.min(1, Math.max(0, progress.current));
    }
    flipGroup.current.rotation.z = progress.current * Math.PI;
  });

  // The email only mounts once the flip is mostly complete, so it doesn't
  // show through the back of the phone mid-rotation.
  const showEmail = flipped && progress.current > 0.85;

  return (
    <group position={position} rotation={[0, -0.15, 0]}>
      {/* Flip group — origin at the phone's centre height so a Z rotation
          turns it in place rather than swinging it through the desk. */}
      <group ref={flipGroup} position={[0, H / 2, 0]}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={BG_VOID} roughness={0.25} metalness={0.5} />
        </mesh>
        {/* Camera bump — on the back face (+Y while face-down). */}
        <mesh position={[W * 0.28, H / 2 + 0.0015, -D * 0.32]}>
          <boxGeometry args={[0.018, 0.003, 0.018]} />
          <meshStandardMaterial color={INK_GHOST} roughness={0.3} metalness={0.65} />
        </mesh>
        {/* Screen — on the face (−Y while face-down; faces up once flipped). */}
        <mesh position={[0, -H / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W - 0.006, D - 0.006]} />
          <meshStandardMaterial color={BG_VOID} roughness={0.9} metalness={0} />
        </mesh>
        {showEmail && (
          <Html
            position={[0, -H / 2 - 0.002, 0]}
            transform={false}
            prepend
            center
            pointerEvents="auto"
          >
            <a className={phoneStyles.mailto} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </Html>
        )}
      </group>
    </group>
  );
}
