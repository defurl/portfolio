// Desk-scene audio engine (Checkpoint B 1.18) — a simple Tone.js-generated
// lo-fi loop at 0.3 master gain. A real composed track replaces this in P2.
//
// Tone.js is dynamically imported on first enable, so the (sizeable) audio
// library stays out of the bundle entirely until the visitor opts in —
// audio is opt-in, so its code is too. `Tone.start()` is the user-gesture
// unlock; it must be called from within the toggle click handler's call
// stack, which it is (setDeskAudio is invoked from the AudioToggle bridge).

/* eslint-disable @typescript-eslint/no-explicit-any */
// reason: Tone.js is dynamically imported; typing its surface here would
// pull @types into the entry graph for no benefit. Confined to this file.

const MASTER_GAIN = 0.3;
const BPM = 68;

// Soft minor-key pad chords (Hz-ish note names) — a slow four-chord cycle.
const CHORDS: string[][] = [
  ['A2', 'C3', 'E3', 'G3'],
  ['F2', 'A2', 'C3', 'E3'],
  ['C3', 'E3', 'G3', 'B3'],
  ['G2', 'B2', 'D3', 'F3'],
];

let tone: any = null;
let synth: any = null;
let loop: any = null;
let built = false;

async function build(): Promise<void> {
  if (built) return;
  tone = await import('tone');
  await tone.start(); // user-gesture unlock

  tone.getTransport().bpm.value = BPM;

  const master = new tone.Gain(MASTER_GAIN).toDestination();
  const reverb = new tone.Reverb({ decay: 6, wet: 0.4 }).connect(master);
  const filter = new tone.Filter(900, 'lowpass').connect(reverb);
  synth = new tone.PolySynth(tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 1.2, decay: 0.4, sustain: 0.6, release: 3 },
    volume: -8,
  }).connect(filter);

  let chordIndex = 0;
  loop = new tone.Loop((time: number) => {
    synth.triggerAttackRelease(CHORDS[chordIndex % CHORDS.length], '2n', time);
    chordIndex += 1;
  }, '2n');

  built = true;
}

/** Start or stop the desk lo-fi loop. Builds the graph lazily on first call. */
export async function setDeskAudio(enabled: boolean): Promise<void> {
  if (enabled) {
    await build();
    loop.start(0);
    tone.getTransport().start();
  } else if (built) {
    tone.getTransport().pause();
  }
}
