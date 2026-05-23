import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useInteractionStore, type ObjectId } from '../../lib/stores/interactionStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { useAudioStore } from '../../lib/stores/audioStore';
import labelStyles from './HoverLabel.module.css';

// Wraps a desk object with the Checkpoint B/C interaction grammar.
//
// Desktop: pointer-over shows the label, pointer-out hides it, click runs
// `onActivate`. Cursor pointer only when clickable.
//
// Mobile (1.22): touch has no hover — first tap "arms" the object (label
// shows for ~3s with a glow), second tap on the SAME object within that
// window activates. A tap on a different (armed) object disarms the old
// one and arms the new. Tapping the empty desk dismisses any armed label
// (handled by the panel/canvas — see DeskScene/DeskRoute).

interface InteractiveObjectProps {
  id: ObjectId;
  label?: string;
  labelPosition?: [number, number, number];
  onActivate?: () => void;
  children: ReactNode;
}

const ARM_WINDOW_MS = 3000;

export function InteractiveObject({
  id,
  label,
  labelPosition = [0, 0.6, 0],
  onActivate,
  children,
}: InteractiveObjectProps) {
  const [hovered, setHovered] = useState(false);
  const setHoveredStore = useInteractionStore(s => s.setHovered);
  const focused = useInteractionStore(s => s.focus !== null);
  const isMobile = useSceneStore(s => s.isMobile);

  // Armed state for the mobile tap-to-label/tap-to-activate flow.
  const [armed, setArmed] = useState(false);
  const armedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearArm = () => {
    if (armedTimeout.current) {
      clearTimeout(armedTimeout.current);
      armedTimeout.current = null;
    }
    setArmed(false);
  };
  useEffect(() => () => clearArm(), []);

  const enter = (e: ThreeEvent<PointerEvent>) => {
    if (isMobile) return; // mobile uses tap, not hover
    e.stopPropagation();
    setHovered(true);
    setHoveredStore(id);
    document.body.style.cursor = onActivate ? 'pointer' : 'auto';
    if (useAudioStore.getState().enabled) {
      // TODO: hover tick at ~0.02 gain — Phase 2 audio palette.
    }
  };

  const leave = (e: ThreeEvent<PointerEvent>) => {
    if (isMobile) return;
    e.stopPropagation();
    setHovered(false);
    setHoveredStore(null);
    document.body.style.cursor = 'auto';
  };

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!onActivate) return;
    if (!isMobile) {
      onActivate();
      return;
    }
    // Mobile: first tap arms; second tap on the same object within the
    // window activates. Different object → re-arm.
    if (armed) {
      clearArm();
      onActivate();
    } else {
      setArmed(true);
      setHoveredStore(id);
      armedTimeout.current = setTimeout(clearArm, ARM_WINDOW_MS);
    }
  };

  // The label shows on hover (desktop) or when armed (mobile), suppressed
  // whenever a panel is open so it doesn't float over the open content.
  const showLabel = label && !focused && (hovered || armed);

  return (
    <group onPointerOver={enter} onPointerOut={leave} onClick={click}>
      {children}
      {showLabel && (
        <Html position={labelPosition} transform={false} prepend center pointerEvents="none">
          <span className={labelStyles.label}>{label}</span>
        </Html>
      )}
    </group>
  );
}
