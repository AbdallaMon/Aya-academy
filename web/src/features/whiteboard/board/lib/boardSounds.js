// Playful, asset-free sounds via Web Audio. One AudioContext, lazily created and
// resumed on first user gesture (the reaction click itself is a gesture).
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

// Distinct little motifs per reaction kind.
const MOTIFS = {
  cheer: () =>
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle")),
  pop: () => tone(880, 0, 0.12, "square", 0.2),
  clap: () =>
    [300, 260, 320].forEach((f, i) => tone(f, i * 0.06, 0.08, "sawtooth", 0.12)),
  sparkle: () =>
    [1200, 1600, 2000].forEach((f, i) => tone(f, i * 0.05, 0.18, "sine", 0.1)),
  firework: () => {
    tone(120, 0, 0.2, "sine", 0.2);
    [800, 1000, 1300].forEach((f, i) => tone(f, 0.18 + i * 0.04, 0.2, "triangle", 0.1));
  },
};

export function playReactionSound(kind) {
  (MOTIFS[kind] || MOTIFS.cheer)();
}
