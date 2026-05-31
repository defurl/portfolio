// Phase 2C — sonified audio engine for the Night Desk.
//
// Replaces the 1B static lo-fi loop with a three-voice sonification driven by
// `marketStore` state:
//
//   pad   — soft sustained chords; mode shifts on index.direction (1.5s glide)
//   bass  — sine sub-bass on each beat; tempo maps from VIX (60–92 BPM)
//   tick  — soft wood-block transient on high-volume ticks (top 5% rolling)
//
// Mix bus: master gain 0.3 → lowpass 5kHz → light tape-coded saturation.
//
// Scenes: a per-scene Gain bus (desk/city/nn). City/NN are silent stubs in
// Phase 2 — only desk has voices wired. Scene changes crossfade over 1.5s.
//
// Tone.js stays dynamically imported on first enable so the bundle is
// untouched until the visitor opts in. The engine exports a small imperative
// surface (`setEnabled`, `setScene`, `pushTick`, `setIndex`); the React side
// (DeskAudio / DeskData) calls these.
//
// prefers-reduced-motion: tick percussion is silenced, BPM holds at 60, pad
// key glide lengthens to 3s.

/* eslint-disable @typescript-eslint/no-explicit-any */
// reason: Tone.js is dynamically imported so we don't pull its types into
// the entry graph. Surface is confined to this file.

import type { IndexDirection, IndexSnapshot, MarketTick } from '../lib/data/types';

type SceneKey = 'desk' | 'city' | 'nn';

const MASTER_GAIN = 0.3;
const MASTER_FILTER_HZ = 5000;
const PAD_GLIDE_S = 1.5;
const PAD_GLIDE_REDUCED_S = 3.0;
const BPM_RAMP_S = 4.0;
const SCENE_CROSSFADE_S = 1.5;
const TICK_WINDOW_MS = 60_000;
const TICK_PCTL = 0.95;
const TICK_GAIN = 0.08;
const BASS_GAIN = 0.15;

// Mode → 4-chord cycle. Notes are absolute Tone.js names so the PolySynth can
// just take them directly. All cycles share the same root area so the bass
// (which tracks each cycle's root) stays in a useful register.
const CHORDS_BY_MODE: Record<IndexDirection, string[][]> = {
  // Natural minor (A minor): i, VI, III, VII — the 1B feel.
  flat: [
    ['A2', 'C3', 'E3', 'G3'],
    ['F2', 'A2', 'C3', 'E3'],
    ['C3', 'E3', 'G3', 'B3'],
    ['G2', 'B2', 'D3', 'F3'],
  ],
  // Brighter (A lydian-ish): I, V, vi, IV — opener, slightly hopeful.
  up: [
    ['A2', 'C#3', 'E3', 'G#3'],
    ['E2', 'G#2', 'B2', 'D#3'],
    ['F#2', 'A2', 'C#3', 'E3'],
    ['D2', 'F#2', 'A2', 'C#3'],
  ],
  // Darker (A phrygian): i, bII, bVII, bVI — close, heavy.
  down: [
    ['A2', 'C3', 'E3', 'G3'],
    ['Bb2', 'D3', 'F3', 'A3'],
    ['G2', 'Bb2', 'D3', 'F3'],
    ['F2', 'A2', 'C3', 'E3'],
  ],
};
// Root of each chord, in order — bass plays this on the beat.
const ROOTS_BY_MODE: Record<IndexDirection, string[]> = {
  flat: ['A1', 'F1', 'C2', 'G1'],
  up: ['A1', 'E1', 'F#1', 'D1'],
  down: ['A1', 'Bb1', 'G1', 'F1'],
};

function bpmFromVix(vix: number): number {
  if (vix <= 15) return 60;
  if (vix <= 25) return 68;
  if (vix <= 35) return 80;
  return 92;
}

interface VolumeSample {
  v: number;
  ts: number;
}

let tone: any = null;
let built = false;

// Tone nodes — kept module-scoped so subsequent calls can adjust them.
let master: any = null;
let masterFilter: any = null;
let masterSaturation: any = null;
let sceneBus: Record<SceneKey, any> = {} as any;
let padSynth: any = null;
let bassSynth: any = null;
let tickSynth: any = null;
let tickPanner: any = null;
let chordLoop: any = null;
let bassLoop: any = null;

// Phase 4D NN bus nodes — sustained drone wash, traversal-modulated filter.
let nnFilter: any = null;
let nnOsc1: any = null;
let nnOsc2: any = null;
let nnOsc3: any = null;
let nnLfo: any = null;
let nnTraversal = 0; // [0, 1] — corridor depth fraction

// Engine state.
let enabled = false;
let currentScene: SceneKey = 'desk';
let currentDirection: IndexDirection = 'flat';
let chordIndex = 0;
let reducedMotion = false;
const recentVolumes: VolumeSample[] = [];

async function build(): Promise<void> {
  if (built) return;
  tone = await import('tone');
  await tone.start(); // user-gesture unlock

  tone.getTransport().bpm.value = 68;

  master = new tone.Gain(MASTER_GAIN).toDestination();
  // Tape-coded warmth — a Chebyshev a bit short of "drive" plus a touch of wet.
  masterSaturation = new tone.Chebyshev(2).connect(master);
  masterSaturation.wet.value = 0.15;
  masterFilter = new tone.Filter(MASTER_FILTER_HZ, 'lowpass').connect(masterSaturation);

  // Per-scene gain buses. Desk starts at 1; others start at 0.
  sceneBus = {
    desk: new tone.Gain(1).connect(masterFilter),
    city: new tone.Gain(0).connect(masterFilter),
    nn: new tone.Gain(0).connect(masterFilter),
  };

  // Pad voice — soft triangle through a slow LFO-modulated lowpass + reverb.
  const padReverb = new tone.Reverb({ decay: 6, wet: 0.45 }).connect(sceneBus.desk);
  const padFilter = new tone.Filter(900, 'lowpass').connect(padReverb);
  const padLfo = new tone.LFO({
    frequency: 0.07,
    min: 600,
    max: 1300,
    type: 'sine',
  }).start();
  padLfo.connect(padFilter.frequency);
  padSynth = new tone.PolySynth(tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 3.0, decay: 0.4, sustain: 0.85, release: 4 },
    volume: -10,
            portamento: PAD_GLIDE_S,
  }).connect(padFilter);

  // Bass voice — sine sub through a touch of reverb.
  const bassReverb = new tone.Reverb({ decay: 3, wet: 0.2 }).connect(sceneBus.desk);
  bassSynth = new tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 },
    volume: 20 * Math.log10(BASS_GAIN),
  }).connect(bassReverb);

  // Tick percussion — short noise burst through a tight bandpass for a
  // wood-block-ish character. Panned per-tick via tickPanner.
  tickPanner = new tone.Panner(0).connect(sceneBus.desk);
  const tickFilter = new tone.Filter({ type: 'bandpass', frequency: 2200, Q: 6 }).connect(
    tickPanner,
  );
  tickSynth = new tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    volume: 20 * Math.log10(TICK_GAIN),
  }).connect(tickFilter);

  // Phase 4D — Neural Network bus: three sustained drone oscillators in a
  // wide low-density minor triad, fed through a slow-LFO-modulated lowpass.
  // The filter cutoff is also gently lifted by `nnTraversal` (0..1) so the
  // tone "opens up" as the visitor walks deeper into the corridor and past
  // chambers. Reverence-coded: no rhythm, infinite sustain, slow drift.
  const nnReverb = new tone.Reverb({ decay: 12, wet: 0.7 }).connect(sceneBus.nn);
  nnFilter = new tone.Filter(380, 'lowpass').connect(nnReverb);
  nnLfo = new tone.LFO({ frequency: 0.05, min: 0, max: 220, type: 'sine' }).start();
  nnLfo.connect(nnFilter.frequency);
  const nnFreqs: ReadonlyArray<number> = [55, 82.41, 123.47]; // A1, E2, B2 — open minor
  const nnGains = [0.12, 0.09, 0.07];
  nnOsc1 = new tone.Oscillator(nnFreqs[0], 'sine').start();
  nnOsc2 = new tone.Oscillator(nnFreqs[1], 'triangle').start();
  nnOsc3 = new tone.Oscillator(nnFreqs[2], 'sine').start();
  // Each oscillator into a small fixed-gain node, all into the NN filter.
  const g1 = new tone.Gain(nnGains[0]).connect(nnFilter);
  const g2 = new tone.Gain(nnGains[1]).connect(nnFilter);
  const g3 = new tone.Gain(nnGains[2]).connect(nnFilter);
  nnOsc1.connect(g1);
  nnOsc2.connect(g2);
  nnOsc3.connect(g3);

  // Chord loop — fires a chord on every half note. Pad voice runs continuously
  // via the long attack/release; we re-trigger to advance the cycle.
  chordLoop = new tone.Loop((time: number) => {
    const cycle = CHORDS_BY_MODE[currentDirection];
    const chord = cycle[chordIndex % cycle.length];
    padSynth.triggerAttackRelease(chord, '1n', time);
    chordIndex += 1;
  }, '2n');

  // Bass loop — one note per beat at the current chord's root.
  bassLoop = new tone.Loop((time: number) => {
    const roots = ROOTS_BY_MODE[currentDirection];
    // Bass leads pad by half a beat — use the *next* chord index so the
    // perceived root tracks the harmonic motion.
    const root = roots[chordIndex % roots.length];
    bassSynth.triggerAttackRelease(root, '8n', time);
  }, '4n');

  built = true;
}

/** Engine entry-point: enable/disable the audio output. */
export async function setEnabled(next: boolean): Promise<void> {
  enabled = next;
  if (next) {
    await build();
    chordLoop.start(0);
    bassLoop.start(0);
    tone.getTransport().start();
  } else if (built) {
    tone.getTransport().pause();
  }
}

/** Crossfade to a different scene's bus over SCENE_CROSSFADE_S. */
export function setScene(next: SceneKey): void {
  if (!built || next === currentScene) {
    currentScene = next;
    return;
  }
  const t = tone.now();
  sceneBus[currentScene].gain.cancelScheduledValues(t);
  sceneBus[currentScene].gain.rampTo(0, SCENE_CROSSFADE_S);
  sceneBus[next].gain.cancelScheduledValues(t);
  sceneBus[next].gain.rampTo(1, SCENE_CROSSFADE_S);
  currentScene = next;
}

/** Update the index — drives pad mode (direction) and bass tempo (VIX). */
export function setIndex(snap: IndexSnapshot): void {
  if (!built) return;
  if (snap.direction !== currentDirection) {
    currentDirection = snap.direction;
    // Glide is implicit via the chord loop's next trigger — pad's portamento
    // and the 2-bar cycle mean the perceived shift lands within ~2s.
    padSynth.set({ portamento: reducedMotion ? PAD_GLIDE_REDUCED_S : PAD_GLIDE_S });
  }
  const targetBpm = reducedMotion ? 60 : bpmFromVix(snap.vix);
  tone.getTransport().bpm.rampTo(targetBpm, BPM_RAMP_S);
}

/** Trade tick — fires percussion if the tick is in the top TICK_PCTL of the
 *  rolling 60-second volume window. Reduced-motion silences this entirely. */
export function pushTick(tick: MarketTick): void {
  if (!built || !enabled) return;
  const now = tick.ts;
  recentVolumes.push({ v: tick.volume, ts: now });
  // Prune.
  while (recentVolumes.length && now - recentVolumes[0]!.ts > TICK_WINDOW_MS) {
    recentVolumes.shift();
  }
  if (reducedMotion) return;
  if (recentVolumes.length < 20) return; // not enough data to threshold
  // Compute the 95th percentile.
  const sorted = recentVolumes.map((s) => s.v).sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * TICK_PCTL);
  const threshold = sorted[Math.min(idx, sorted.length - 1)]!;
  if (tick.volume < threshold) return;
  // Pan by first-letter charcode — A=0..Z=25 → -0.5..+0.5.
  const c = tick.ticker.charCodeAt(0);
  const pan = ((c - 65) / 25) - 0.5;
  tickPanner.pan.rampTo(pan, 0.02);
  tickSynth.triggerAttackRelease('32n', tone.now());
}

/** Inform the engine of the prefers-reduced-motion state. Takes effect on the
 *  next index update / tick. */
export function setReducedMotion(next: boolean): void {
  reducedMotion = next;
  if (!built) return;
  padSynth.set({ portamento: next ? PAD_GLIDE_REDUCED_S : PAD_GLIDE_S });
  if (next) tone.getTransport().bpm.rampTo(60, BPM_RAMP_S);
}

/** Phase 4D — set the NN traversal fraction (0 = corridor entry, 1 = back
 *  wall). Lifts the NN bus filter cutoff so the tone "opens up" as the
 *  visitor walks deeper. Smoothed via rampTo to avoid filter zipper noise. */
export function setNnTraversal(progress: number): void {
  nnTraversal = Math.max(0, Math.min(1, progress));
  if (!built || !nnFilter) return;
  // Base 380 Hz + up to +900 Hz of opening; the LFO still wobbles ±220 Hz
  // around the new target.
  const target = 380 + nnTraversal * 900;
  nnFilter.frequency.rampTo(target, 0.6);
}

// Kept for the 1B import path — no behavioral change vs setEnabled.
export const setDeskAudio = setEnabled;
