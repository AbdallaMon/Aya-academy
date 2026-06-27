"use client";

// useGameSounds — warm, kid-friendly Web Audio toy-instrument. NO speech / NO TTS.
//
// Exposes:
//   const s = useGameSounds();
//   s.play(name)        → a named cue (see PLAY below)
//   s.playDigit(key)    → a per-digit "ring" tone (0-9 → a little pentatonic note,
//                          so dialing a number plays a happy melody)
//   s.playTick(ratio)   → a live pitched blip for sliders/compass (0..1 → low..high)
//   s.muted / s.toggleMute() / s.setMuted()
//
// Sound design: the core "bell" voice is a tiny marimba — two slightly detuned
// oscillators (for a living, chorused shimmer) plus a soft sub-octave for warmth,
// shaped by a quick pluck envelope and a per-voice low-pass so nothing is ever
// harsh on little ears. On top of that we add:
//   • blip()  — a clean single tone (digits, ticks, glides)
//   • noise() — a soft filtered noise burst (paint brush, whoosh, dice tumble)
//   • chord() / melody() — stacked / sequenced bell voices (matches, fanfares)
// Everything runs through a gentle compressor + a short generated reverb so cues
// feel rounded and "produced" rather than like raw beeps.
//
// The AudioContext is created lazily on the first user gesture (browsers block
// audio until then). Mute state is persisted to localStorage under "aya_muted".

import { useCallback, useEffect, useRef, useState } from "react";

const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.5, F6: 1396.91, G6: 1568, A6: 1760, C7: 2093,
};

// A happy major-pentatonic ladder, one note per dial key — any number a child
// taps becomes a pleasant little tune. (key "0" sits on top.)
const DIGIT_NOTES = {
  "1": NOTES.C5, "2": NOTES.D5, "3": NOTES.E5,
  "4": NOTES.G5, "5": NOTES.A5, "6": NOTES.C6,
  "7": NOTES.D6, "8": NOTES.E6, "9": NOTES.G6,
  "0": NOTES.A6, "*": NOTES.A4, "#": NOTES.B5,
};

const STORAGE_KEY = "aya_muted";

function readMuted() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// A short, smooth reverb impulse generated in-memory (no audio assets). Gentle
// exponential decay so notes get a soft "room" tail without smearing.
function buildImpulse(ctx, seconds = 1.6, decay = 3.2) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
  }
  return impulse;
}

export function useGameSounds() {
  const [muted, setMutedState] = useState(readMuted);
  const mutedRef = useRef(muted);
  const ctxRef = useRef(null);
  const busRef = useRef(null); // dry bus (after compressor)
  const reverbInRef = useRef(null); // wet send input
  const noiseBufRef = useRef(null); // cached white-noise buffer

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Lazily create / resume the AudioContext + master chain (needs a gesture).
  const audioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();

      const master = ctx.createGain();
      master.gain.value = 0.85;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;

      master.connect(comp);
      comp.connect(ctx.destination);

      let reverbIn = master;
      try {
        const send = ctx.createGain();
        send.gain.value = 1;
        const convolver = ctx.createConvolver();
        convolver.buffer = buildImpulse(ctx);
        const wet = ctx.createGain();
        wet.gain.value = 0.22;
        send.connect(convolver);
        convolver.connect(wet);
        wet.connect(master);
        reverbIn = send;
      } catch {
        // no reverb → dry only
      }

      ctxRef.current = ctx;
      busRef.current = master;
      reverbInRef.current = reverbIn;
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  // One warm marimba/bell voice: detuned pair + sub-octave, pluck envelope,
  // per-voice low-pass, mixed dry + a touch of reverb.
  const note = useCallback(
    (freq, startIn, dur, opts = {}) => {
      if (mutedRef.current || !freq) return;
      const ctx = audioCtx();
      if (!ctx) return;
      try {
        const bus = busRef.current;
        const reverbIn = reverbInRef.current;
        const t = ctx.currentTime + (startIn || 0);
        const type = opts.type || "triangle";
        const peak = opts.gain == null ? 0.08 : opts.gain;
        const detune = opts.detune == null ? 6 : opts.detune;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(peak, t + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(Math.min(freq * 6 + 1200, 8000), t);
        lp.frequency.exponentialRampToValueAtTime(
          Math.min(freq * 3 + 600, 6000),
          t + dur,
        );
        lp.Q.value = 0.6;

        env.connect(lp);
        lp.connect(bus);
        if (reverbIn && reverbIn !== bus) lp.connect(reverbIn);

        const makeOsc = (cents, mul, level) => {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(freq * mul, t);
          osc.detune.setValueAtTime(cents, t);
          if (opts.to) {
            osc.frequency.exponentialRampToValueAtTime(opts.to * mul, t + dur);
          }
          const g = ctx.createGain();
          g.gain.value = level;
          osc.connect(g);
          g.connect(env);
          osc.start(t);
          osc.stop(t + dur + 0.05);
        };

        makeOsc(-detune, 1, 1);
        makeOsc(detune, 1, 0.9);
        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.setValueAtTime(freq / 2, t);
        const subG = ctx.createGain();
        subG.gain.value = 0.35;
        sub.connect(subG);
        subG.connect(env);
        sub.start(t);
        sub.stop(t + dur + 0.05);
      } catch {
        // audio is best-effort; never throw into the UI
      }
    },
    [audioCtx],
  );

  // A clean single tone (no sub, no chorus) — digits, ticks, glides. Optional
  // `to` glides the pitch; optional `partial` adds a soft fifth on top (a gentle
  // "telephone" colour for the dial keys).
  const blip = useCallback(
    (freq, startIn, dur, opts = {}) => {
      if (mutedRef.current || !freq) return;
      const ctx = audioCtx();
      if (!ctx) return;
      try {
        const bus = busRef.current;
        const reverbIn = reverbInRef.current;
        const t = ctx.currentTime + (startIn || 0);
        const type = opts.type || "sine";
        const peak = opts.gain == null ? 0.06 : opts.gain;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.008));
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        env.connect(bus);
        if (opts.wet && reverbIn && reverbIn !== bus) {
          const sendG = ctx.createGain();
          sendG.gain.value = opts.wet;
          env.connect(sendG);
          sendG.connect(reverbIn);
        }

        const mk = (f, level) => {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(f, t);
          if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
          const g = ctx.createGain();
          g.gain.value = level;
          osc.connect(g);
          g.connect(env);
          osc.start(t);
          osc.stop(t + dur + 0.04);
        };
        mk(freq, 1);
        if (opts.partial) mk(freq * 1.5, 0.4 * opts.partial); // soft fifth
      } catch {
        // best-effort
      }
    },
    [audioCtx],
  );

  // A soft filtered noise burst — paint brush, whoosh, dice tumble, sparkle air.
  const noise = useCallback(
    (startIn, dur, opts = {}) => {
      if (mutedRef.current) return;
      const ctx = audioCtx();
      if (!ctx) return;
      try {
        const bus = busRef.current;
        const t = ctx.currentTime + (startIn || 0);
        if (!noiseBufRef.current) {
          const len = ctx.sampleRate * 1.0;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
          noiseBufRef.current = buf;
        }
        const src = ctx.createBufferSource();
        src.buffer = noiseBufRef.current;

        const filt = ctx.createBiquadFilter();
        filt.type = opts.filter || "bandpass";
        const f0 = opts.freq ?? 1200;
        filt.frequency.setValueAtTime(f0, t);
        if (opts.sweepTo) filt.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + dur);
        filt.Q.value = opts.q ?? 0.8;

        const env = ctx.createGain();
        const peak = opts.gain ?? 0.05;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.01));
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        src.connect(filt);
        filt.connect(env);
        env.connect(bus);
        src.start(t);
        src.stop(t + dur + 0.04);
      } catch {
        // best-effort
      }
    },
    [audioCtx],
  );

  const melody = useCallback(
    (seq, opts = {}) => {
      let t = 0;
      seq.forEach((n) => {
        const freq = typeof n.f === "string" ? NOTES[n.f] : n.f;
        note(freq, t, n.d, { ...opts, ...(n.o || {}) });
        t += n.s == null ? n.d * 0.62 : n.s;
      });
    },
    [note],
  );

  const chord = useCallback(
    (freqs, startIn, dur, opts = {}) => {
      freqs.forEach((f, i) => note(typeof f === "string" ? NOTES[f] : f, startIn, dur, { ...opts, gain: (opts.gain ?? 0.06) * (1 - i * 0.12) }));
    },
    [note],
  );

  // ── named cues ──────────────────────────────────────────────────────────────
  const play = useCallback(
    (name) => {
      switch (name) {
        // tiny taps / UI
        case "click":
          blip(NOTES.E5, 0, 0.07, { type: "sine", gain: 0.035 });
          break;
        case "tap":
          blip(NOTES.A5, 0, 0.09, { type: "triangle", gain: 0.05 });
          break;
        case "pick":
          blip(NOTES.E5, 0, 0.1, { type: "triangle", gain: 0.05 });
          blip(NOTES.A5, 0.05, 0.12, { type: "triangle", gain: 0.045 });
          break;
        case "pop":
          blip(NOTES.D5, 0, 0.13, { type: "sine", gain: 0.07, to: NOTES.A5 });
          break;

        // choosing an option / a card
        case "select":
          blip(NOTES.G5, 0, 0.1, { type: "triangle", gain: 0.05, to: NOTES.C6 });
          break;

        // catch a flying good-deed: quick rising pop + air sparkle
        case "catch":
          blip(NOTES.A5, 0, 0.12, { type: "triangle", gain: 0.06, to: NOTES.E6 });
          noise(0.02, 0.12, { filter: "highpass", freq: 3000, gain: 0.025 });
          break;

        // placing / dropping an item into the right slot
        case "place":
          blip(NOTES.C5, 0, 0.09, { type: "sine", gain: 0.06 });
          note(NOTES.G5, 0.05, 0.14, { type: "triangle", gain: 0.06 });
          break;

        // a sticker / good-deed lands with a soft stamp
        case "stamp":
          blip(NOTES.C4, 0, 0.1, { type: "sine", gain: 0.08, to: NOTES.G4 });
          note(NOTES.C6, 0.06, 0.18, { type: "triangle", gain: 0.05 });
          break;

        // matching two cards: a warm rising third → sparkle
        case "match":
          melody([{ f: "E5", d: 0.13 }, { f: "G5", d: 0.13 }, { f: "C6", d: 0.2 }], { type: "triangle", gain: 0.07 });
          break;

        // compass / tone locks onto the good zone
        case "lock":
          blip(NOTES.C6, 0, 0.1, { type: "triangle", gain: 0.06, to: NOTES.E6 });
          chord(["C6", "E6", "G6"], 0.08, 0.26, { gain: 0.05 });
          break;

        // paint a region: airy brush swish + a soft tone
        case "paint":
          noise(0, 0.22, { filter: "bandpass", freq: 900, sweepTo: 2600, gain: 0.04, q: 0.7 });
          blip(NOTES.A5, 0.02, 0.16, { type: "sine", gain: 0.035, to: NOTES.C6 });
          break;

        // rolling the die: a little tumble of soft clicks
        case "roll":
          [0, 0.06, 0.12, 0.18, 0.24].forEach((t, i) => {
            blip(NOTES.E5 + i * 30, t, 0.05, { type: "triangle", gain: 0.035 });
            noise(t, 0.05, { filter: "bandpass", freq: 1600, gain: 0.02 });
          });
          break;

        // climbing a kindness ladder: bright rising glissando + sparkle
        case "climb":
          blip(NOTES.C5, 0, 0.42, { type: "triangle", gain: 0.05, to: NOTES.C6, attack: 0.02 });
          melody([{ f: "G5", d: 0.1 }, { f: "C6", d: 0.1 }, { f: "E6", d: 0.16 }], { type: "sine", gain: 0.05 });
          break;

        // gentle slide back (never sad/harsh): soft downward glide
        case "slip":
          blip(NOTES.A5, 0, 0.34, { type: "sine", gain: 0.05, to: NOTES.D5, attack: 0.02 });
          break;

        // whoosh / transition
        case "whoosh":
          noise(0, 0.3, { filter: "bandpass", freq: 500, sweepTo: 3000, gain: 0.04, q: 0.6 });
          break;

        // ring-ring: a friendly two-pulse phone ring after a correct dial
        case "ring":
          [0, 0.5].forEach((start) => {
            blip(NOTES.A5, start, 0.18, { type: "triangle", gain: 0.06, partial: 1 });
            blip(NOTES.A5, start + 0.22, 0.18, { type: "triangle", gain: 0.06, partial: 1 });
          });
          break;

        case "sparkle":
          melody([{ f: "C6", d: 0.08 }, { f: "E6", d: 0.08 }, { f: "G6", d: 0.12 }], { type: "sine", gain: 0.045 });
          break;

        // correct answer: warm rising triad
        case "correct":
          melody([{ f: "C5", d: 0.16 }, { f: "E5", d: 0.16 }, { f: "G5", d: 0.22 }], { type: "triangle", gain: 0.08 });
          break;

        // earn a star: bright bell arpeggio with a sparkle on top
        case "star":
          melody(
            [{ f: "G5", d: 0.14 }, { f: "C6", d: 0.14 }, { f: "E6", d: 0.2, o: { gain: 0.06 } }],
            { type: "sine", gain: 0.07 },
          );
          break;

        // a little extra cheer on top of a star (per-star celebration)
        case "cheer":
          melody(
            [{ f: "C6", d: 0.12 }, { f: "E6", d: 0.12 }, { f: "G6", d: 0.12 }, { f: "C7", d: 0.18 }],
            { type: "sine", gain: 0.05 },
          );
          break;

        // finishing the whole game: a full warm fanfare
        case "win":
          melody(
            [
              { f: "C5", d: 0.16 }, { f: "E5", d: 0.16 }, { f: "G5", d: 0.16 },
              { f: "C6", d: 0.24 }, { f: "E6", d: 0.28, o: { gain: 0.06 } },
              { f: "G6", d: 0.36, o: { gain: 0.05, type: "sine" } },
            ],
            { type: "triangle", gain: 0.08 },
          );
          chord(["C6", "E6", "G6"], 0.95, 0.5, { gain: 0.04, type: "sine" });
          break;

        // gentle, friendly "try again" — soft two-note dip, never harsh
        case "wrong":
          blip(NOTES.F5, 0, 0.18, { type: "sine", gain: 0.06, to: NOTES.D5 });
          blip(NOTES.D5, 0.13, 0.22, { type: "sine", gain: 0.05 });
          break;

        // a softer "oops" used for a wrong tap that isn't a full answer
        case "oops":
          blip(NOTES.E5, 0, 0.14, { type: "sine", gain: 0.05, to: NOTES.C5 });
          break;

        default:
          break;
      }
    },
    [blip, noise, note, melody, chord],
  );

  // A per-digit "ring" tone — every dial key sounds a different happy note (with
  // a soft telephone fifth on top), so dialing a number plays a little melody.
  const playDigit = useCallback(
    (key) => {
      const freq = DIGIT_NOTES[String(key)] || NOTES.A5;
      blip(freq, 0, 0.16, { type: "triangle", gain: 0.07, partial: 0.8, wet: 0.18 });
    },
    [blip],
  );

  // A live pitched blip for sliders / compass: ratio 0..1 → low..high. Use while
  // the child drags so the motion "sings". Kept short and quiet so rapid changes
  // never pile up.
  const playTick = useCallback(
    (ratio) => {
      const r = Math.max(0, Math.min(1, ratio || 0));
      const freq = 330 + r * 990;
      blip(freq, 0, 0.06, { type: "sine", gain: 0.04 });
    },
    [blip],
  );

  const setMuted = useCallback((next) => {
    setMutedState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return value;
    });
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), [setMuted]);

  return { play, playDigit, playTick, muted, toggleMute, setMuted };
}

export default useGameSounds;
