"use client";

// playNotificationChime — a short, pleasant 2-note chime synthesized with the
// Web Audio API (no shipped binary asset). Mirrors the lazy-AudioContext +
// best-effort approach in features/games/hooks/useGameSounds.js.
//
// Browser autoplay policy: the AudioContext can only run after a user gesture.
// We lazily create/resume it, fail silently when it is still suspended, and
// register a one-time pointerdown/keydown listener that unlocks it on the first
// interaction so later chimes can play.

const NOTES = { E5: 659.25, A5: 880.0 };

let ctxRef = null;
let unlockBound = false;

// Lazily create / resume the shared AudioContext. Returns null when unavailable.
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!ctxRef) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctxRef = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctxRef.state === "suspended") {
    ctxRef.resume().catch(() => {});
  }
  return ctxRef;
}

// One soft bell tone: triangle osc through a quick pluck envelope + low-pass.
function tone(ctx, freq, startIn, dur) {
  try {
    const t = ctx.currentTime + startIn;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.07, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.min(freq * 6 + 1200, 8000);
    lp.Q.value = 0.6;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);

    osc.connect(env);
    env.connect(lp);
    lp.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // best-effort; never throw into the UI
  }
}

// Play a gentle rising two-note chime. Silent if audio is blocked/unavailable.
export function playNotificationChime() {
  const ctx = getAudioCtx();
  if (!ctx || ctx.state === "suspended") return;
  tone(ctx, NOTES.E5, 0, 0.18);
  tone(ctx, NOTES.A5, 0.12, 0.26);
}

// Register a one-time gesture listener that unlocks the AudioContext, so a chime
// triggered later (by a socket event, not a gesture) is allowed to sound.
export function unlockNotificationAudio() {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    getAudioCtx(); // create + resume under the gesture
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
