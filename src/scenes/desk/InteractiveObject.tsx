import { useState, type ReactNode } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useInteractionStore, type ObjectId } from '../../lib/stores/interactionStore';
import { useAudioStore } from '../../lib/stores/audioStore';
import labelStyles from './HoverLabel.module.css';

// Wraps a desk object with the Checkpoint B hover/click grammar:
// - pointer over/out → writes `hovered` to the interaction store and sets the
//   document cursor (pointer only when the object is actually clickable).
// - a Departure Mono one-word label appears above the object on hover
//   (drei `<Html>`, transform=false + prepend per 1.11).
// - click → `onActivate()` which the CameraRig + panel layer react to.
//
// Hover feedback is intentionally the label + cursor (+ emissive lift on the
// monitors, which read `hovered` from the store themselves). A wrapping-group
// scale lift was tried and dropped: scaling around the group origin moved
// object feet off the desk. The label is the spec's primary affordance.

interface InteractiveObjectProps {
  id: ObjectId;
  /** One-word label shown above the object on hover. Omit → no label. */
  label?: string;
  /** World position the floating label sits at (usually above the object). */
  labelPosition?: [number, number, number];
  /** Click handler. Omit → not clickable (hover-only). */
  onActivate?: () => void;
  children: ReactNode;
}

export function InteractiveObject({
  id,
  label,
  labelPosition = [0, 0.6, 0],
  onActivate,
  children,
}: InteractiveObjectProps) {
  const [hovered, setHovered] = useState(false);
  const setHoveredStore = useInteractionStore(s => s.setHovered);

  const enter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredStore(id);
    document.body.style.cursor = onActivate ? 'pointer' : 'auto';
    // Audio cue (1.11) — one-shot tick, only if audio is enabled. The audio
    // engine lands in 1.18; until then this is a guarded no-op.
    if (useAudioStore.getState().enabled) {
      // TODO(checkpoint-b 1.18): play hover tick at ~0.02 gain.
    }
  };

  const leave = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    setHoveredStore(null);
    document.body.style.cursor = 'auto';
  };

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!onActivate) return;
    e.stopPropagation();
    onActivate();
  };

  return (
    <group onPointerOver={enter} onPointerOut={leave} onClick={click}>
      {children}
      {label && hovered && (
        <Html position={labelPosition} transform={false} prepend center pointerEvents="none">
          <span className={labelStyles.label}>{label}</span>
        </Html>
      )}
    </group>
  );
}
