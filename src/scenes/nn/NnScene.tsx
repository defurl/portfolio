import { BG_NIGHT, BG_VOID, VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import { NnHall } from './NnHall';
import { NeuronLights } from './NeuronLights';
import { TokenSplines } from './TokenSplines';
import { NnChamber } from './NnChamber';
import { ChamberPanel } from './ChamberPanel';
import { InferenceChamber } from './InferenceChamber';
import { CHAMBERS } from './chambers';
import { NnBloom } from './postfx/NnBloom';
import { NnAudioBridge } from './NnAudioBridge';
import { useNnSettingsStore } from '../../lib/stores/nnSettingsStore';
import projectIndex from '../../../content/projects.json';

interface ProjectIndexEntry {
  id: string;
  title: string;
  category: string;
  district: string;
  thesis: string;
  links: Array<{ label: string; url: string }>;
}
const projects = (projectIndex as { projects: ProjectIndexEntry[] }).projects;
const projectById = new Map(projects.map((p) => [p.id, p] as const));
import {
  HEMISPHERE_INTENSITY,
  SHAFT_INTENSITY,
  SHAFT_POSITIONS,
  SHAFT_TARGETS,
} from './nnLighting';
import { useMemo } from 'react';
import { Object3D } from 'three';

// Phase 4A — Neural Network scene foundation. Tadao Ando concrete corridors
// representing a 4-layer transformer encoder. Lighting is intentionally
// restrained: low cold ambient + a few hard diagonal shafts of cool blue
// light coming through the ceiling gaps. No fill — the contrast IS the form.

export function NnScene() {
  const highFi = useNnSettingsStore((s) => s.highFi);
  // DirectionalLight targets must be Object3D instances added to the scene
  // for three.js to use them; instantiate once per shaft.
  const shaftTargets = useMemo(
    () =>
      SHAFT_TARGETS.map((t) => {
        const o = new Object3D();
        o.position.set(t[0], t[1], t[2]);
        return o;
      }),
    [],
  );

  return (
    <>
      {/* Volumetric fog — endless corridor fades into silent obscurity. */}
      <fog attach="fog" args={[BG_VOID, 0.025]} />

      {/* Cold ambient — preserves shadow depth on the concrete corners. */}
      <hemisphereLight
        color={BG_NIGHT}
        groundColor={BG_VOID}
        intensity={HEMISPHERE_INTENSITY}
      />

      {/* Diagonal shafts through ceiling gaps — Ando-coded raking light.
          Dynamic shadows only in hi-fi mode (per §4.10). */}
      {SHAFT_POSITIONS.map((pos, i) => (
        <group key={i}>
          <primitive object={shaftTargets[i]!} />
          <directionalLight
            position={pos}
            target={shaftTargets[i]}
            color={VOXEL_GLOW_SOFT}
            intensity={SHAFT_INTENSITY}
            castShadow={highFi}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={1}
            shadow-camera-far={40}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0005}
          />
        </group>
      ))}

      <NnHall />
      <NeuronLights />
      <TokenSplines />

      {/* Chambers — project rooms branching off the layer gaps + the
          inference chamber at the end of the hall. */}
      {CHAMBERS.map((cfg) => {
        if (cfg.projectId === null) {
          return (
            <NnChamber key={cfg.id} config={cfg}>
              <InferenceChamber side={cfg.side} />
            </NnChamber>
          );
        }
        const p = projectById.get(cfg.projectId);
        if (!p) return null;
        return (
          <NnChamber key={cfg.id} config={cfg}>
            <ChamberPanel
              side={cfg.side}
              eyebrow={cfg.label}
              title={p.title}
              thesis={p.thesis}
              links={p.links}
            />
          </NnChamber>
        );
      })}

      <NnBloom />
      <NnAudioBridge />
    </>
  );
}
