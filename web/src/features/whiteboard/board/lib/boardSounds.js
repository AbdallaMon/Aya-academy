// Playful, asset-free sounds via Web Audio. One AudioContext, lazily created and
// resumed on the first user gesture (the reaction click itself is a gesture).
let ctx = null;
function ac() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = "sine", gain = 0.15) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur);
}

// A short burst of band-passed white noise — the building block of a hand-clap.
function noiseBurst(start, dur, { freq = 1500, q = 0.7, gain = 0.35 } = {}) {
  const a = ac();
  if (!a) return;
  const frames = Math.floor(a.sampleRate * dur);
  const buffer = a.createBuffer(1, frames, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    // Fast exponential decay so each burst sounds like a single clap.
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
  }
  const src = a.createBufferSource();
  src.buffer = buffer;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

const MOTIFS = {
  // Rising major arpeggio — a happy "yay!".
  cheer: () =>
    [523, 659, 784, 1046, 1319].forEach((f, i) =>
      tone(f, i * 0.08, 0.28, "triangle", 0.14),
    ),
  // Bright little pop.
  pop: () => {
    tone(880, 0, 0.1, "square", 0.18);
    tone(1320, 0.03, 0.12, "sine", 0.12);
  },
  // Soft magnet "clack" — a low thunk when a magnetic letter/tile snaps down.
  magnet: () => {
    tone(180, 0, 0.07, "square", 0.12);
    tone(120, 0.02, 0.1, "sine", 0.16);
  },
  // A tiny bright "tick" when a letter is grabbed or placed.
  letter: () => {
    tone(1046, 0, 0.06, "triangle", 0.12);
    tone(1568, 0.04, 0.07, "sine", 0.08);
  },
  // Dry metronome-like tick (timer countdown).
  tick: () => tone(1200, 0, 0.04, "square", 0.08),
  // Warm two-note "ding!" — timer finished / gentle chime.
  ding: () => {
    tone(1318, 0, 0.5, "sine", 0.16);
    tone(1976, 0.12, 0.45, "sine", 0.08);
  },
  // Airy upward whoosh — mode on (spotlight/reveal).
  whoosh: () => {
    const a = ac();
    if (!a) return;
    for (let i = 0; i < 8; i += 1) {
      tone(300 + i * 160, i * 0.018, 0.14, "sine", 0.05);
    }
  },
  // Playful "boing" when a sticker/emoji lands on the board.
  sticker: () => {
    tone(660, 0, 0.09, "triangle", 0.14);
    tone(990, 0.06, 0.12, "sine", 0.1);
  },
  // Descending spin whir — the name wheel turning.
  spin: () => {
    const a = ac();
    if (!a) return;
    for (let i = 0; i < 6; i += 1) {
      tone(900 - i * 90, i * 0.05, 0.08, "square", 0.06);
    }
  },
  // Triumphant "ta-daa!" — a quick rising run into a held major chord. The
  // "someone won!" fanfare for the name wheel / a big success.
  win: () => {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.1, 0.16, "triangle", 0.14));
    [784, 988, 1175].forEach((f) => tone(f, 0.32, 0.6, "triangle", 0.12));
    tone(1568, 0.34, 0.45, "sine", 0.07);
  },
  // Applause: many overlapping noise bursts with slight timing jitter.
  clap: () => {
    for (let i = 0; i < 12; i += 1) {
      const t = i * 0.055 + (i % 3) * 0.012;
      noiseBurst(t, 0.09, { freq: 1400 + (i % 4) * 220, q: 0.8, gain: 0.28 });
    }
  },
  // Shimmering sparkle up the scale.
  sparkle: () =>
    [1200, 1500, 1800, 2200, 2600].forEach((f, i) =>
      tone(f, i * 0.05, 0.2, "sine", 0.09),
    ),
  // Boom + crackle.
  firework: () => {
    tone(90, 0, 0.28, "sine", 0.28);
    noiseBurst(0.16, 0.25, { freq: 2200, q: 0.5, gain: 0.3 });
    [900, 1200, 1500].forEach((f, i) => tone(f, 0.2 + i * 0.05, 0.22, "triangle", 0.1));
  },
};

export function playReactionSound(kind) {
  (MOTIFS[kind] || MOTIFS.cheer)();
}

// Generic entry point for the board tools (laser, timer, letters, wheel, …).
// Unknown names are ignored silently so a tool can never crash the board.
export function playBoardSound(name) {
  const motif = MOTIFS[name];
  if (motif) motif();
}
