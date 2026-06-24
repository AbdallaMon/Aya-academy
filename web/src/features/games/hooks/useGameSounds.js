"use client";

// useGameSounds — warm, kid-friendly Web Audio chimes. NO speech / NO TTS.
//
// Exposes:
//   const { play, muted, toggleMute, setMuted } = useGameSounds();
//   play("tap" | "click" | "pick" | "pop" | "correct" | "star" | "win" | "wrong")
//
// Sound design: every note is a tiny marimba/bell voice — TWO slightly detuned
// oscillators (for a living, chorused shimmer) plus a soft sub-octave for
// warmth, shaped by a quick pluck envelope and a per-voice low-pass so nothing
// is ever harsh on little ears. The whole mix runs through a gentle compressor
// and a short algorithmic reverb (a generated impulse) so cues feel rounded and
// "produced" rather than like raw beeps.
//
// The AudioContext is created lazily on the first user gesture (browsers block
// audio until then). Mute state is persisted to localStorage under "aya_muted".

import { useCallback, useEffect, useRef, useState } from "react";

const NOTES = {
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568,
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
      // decaying white noise → smooth, colorless tail
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

      // master gain → soft compressor → destination
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

      // reverb send: input gain → convolver → wet gain → master
      let reverbIn = master; // graceful fallback if convolver is unavailable
      try {
        const send = ctx.createGain();
        send.gain.value = 1;
        const convolver = ctx.createConvolver();
        convolver.buffer = buildImpulse(ctx);
        const wet = ctx.createGain();
        wet.gain.value = 0.22; // subtle, never washy
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

        // shared envelope for this voice
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(peak, t + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        // gentle low-pass so highs stay soft; opens slightly on attack
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

        // two slightly detuned voices for a chorused shimmer
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
        // soft sub-octave for body (sine keeps it clean)
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

  // The named chimes — same API as before, richer voices.
  const play = useCallback(
    (name) => {
      switch (name) {
        case "click":
          note(NOTES.E5, 0, 0.08, { type: "sine", gain: 0.04, detune: 4 });
          break;
        case "tap":
          note(NOTES.A5, 0, 0.1, { type: "triangle", gain: 0.055 });
          break;
        case "pick":
          note(NOTES.E5, 0, 0.12, { type: "triangle", gain: 0.06 });
          note(NOTES.A5, 0.06, 0.14, { type: "triangle", gain: 0.055 });
          break;
        case "pop":
          note(NOTES.D5, 0, 0.14, { type: "sine", gain: 0.07, to: NOTES.A5 });
          break;
        case "correct":
          melody(
            [{ f: "C5", d: 0.16 }, { f: "E5", d: 0.16 }, { f: "G5", d: 0.22 }],
            { type: "triangle", gain: 0.08 },
          );
          break;
        case "star":
          // bright little bell arpeggio with a sparkle on top
          melody(
            [
              { f: "G5", d: 0.14 },
              { f: "C6", d: 0.14 },
              { f: "E6", d: 0.2, o: { gain: 0.06 } },
            ],
            { type: "sine", gain: 0.07 },
          );
          break;
        case "win":
          // fuller fanfare: rising triad → octave → shimmering top, soft and warm
          melody(
            [
              { f: "C5", d: 0.16 },
              { f: "E5", d: 0.16 },
              { f: "G5", d: 0.16 },
              { f: "C6", d: 0.24 },
              { f: "E6", d: 0.28, o: { gain: 0.06 } },
              { f: "G6", d: 0.36, o: { gain: 0.05, type: "sine" } },
            ],
            { type: "triangle", gain: 0.08 },
          );
          break;
        case "wrong":
          // gentle, friendly "try again" — soft two-note dip, never harsh
          note(NOTES.F5, 0, 0.18, { type: "sine", gain: 0.06, to: NOTES.D5 });
          note(NOTES.D5, 0.13, 0.22, { type: "sine", gain: 0.05 });
          break;
        default:
          break;
      }
    },
    [note, melody],
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

  return { play, muted, toggleMute, setMuted };
}

export default useGameSounds;
