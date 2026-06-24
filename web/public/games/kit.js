/* ============================================================
   Aya Kids Games — shared sound + animation kit
   Gentle, child-friendly xylophone-style sounds (Web Audio).
   NO speech synthesis / NO spoken voice (Arabic-only UI text).
   Auto click sound on every button/option. Load with:
   <script src="kit.js"></script>  then use window.AyaKit.*
   ============================================================ */
(function () {
  const NOTES = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 };

  let ctx = null;
  let master = null;
  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // one soft note with gentle attack/release; optional pitch glide
  function note(freq, startIn, dur, opts) {
    if (AyaKit.muted) return;
    opts = opts || {};
    try {
      const c = ac();
      const t = c.currentTime + (startIn || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
      const peak = opts.gain == null ? 0.08 : opts.gain;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function melody(seq, opts) {
    let t = 0;
    seq.forEach((n) => {
      note(typeof n.f === "string" ? NOTES[n.f] : n.f, t, n.d, Object.assign({}, opts, n.o));
      t += n.s == null ? n.d * 0.7 : n.s;
    });
  }

  const sound = {
    click() { note(600, 0, 0.05, { type: "sine", gain: 0.035 }); },
    tap() { note(740, 0, 0.07, { type: "triangle", gain: 0.05 }); },
    pick() { note(NOTES.A5, 0, 0.09, { type: "sine", gain: 0.06 }); note(NOTES.C6, 0.05, 0.09, { type: "sine", gain: 0.05 }); },
    pop() { note(380, 0, 0.1, { type: "sine", gain: 0.06, to: 780 }); },
    correct() { melody([{ f: "C5", d: 0.14 }, { f: "E5", d: 0.14 }, { f: "G5", d: 0.18 }], { type: "triangle", gain: 0.08 }); },
    star() { note(NOTES.B5, 0, 0.1, { type: "triangle", gain: 0.06 }); note(NOTES.E6, 0.07, 0.14, { type: "triangle", gain: 0.06 }); },
    win() { melody([{ f: "C5", d: 0.14 }, { f: "E5", d: 0.14 }, { f: "G5", d: 0.14 }, { f: "C6", d: 0.22 }, { f: "G6", d: 0.26, o: { gain: 0.05 } }], { type: "triangle", gain: 0.08 }); },
    // gentle, friendly "try again" — soft, never harsh
    wrong() { note(440, 0, 0.16, { type: "sine", gain: 0.06, to: 392 }); note(349, 0.14, 0.2, { type: "sine", gain: 0.05 }); },
  };

  const AyaKit = {
    muted: false,
    NOTES,
    sound,
    init() {
      try { this.muted = localStorage.getItem("aya_muted") === "1"; } catch (e) {}
      // unlock + auto click sound on first interaction and every click
      const onDown = (e) => {
        ac();
        const el = e.target.closest("button, .btn, .opt, .pick, .key, .stk, .sw, .card, [data-snd]");
        if (el && !el.dataset.nosnd) this.sound.click();
      };
      document.addEventListener("pointerdown", onDown, { passive: true });
      return this;
    },
    toggleMute() {
      this.muted = !this.muted;
      try { localStorage.setItem("aya_muted", this.muted ? "1" : "0"); } catch (e) {}
      return this.muted;
    },
    wireMute(btn) {
      if (!btn) return;
      btn.textContent = this.muted ? "🔇" : "🔊";
      btn.addEventListener("click", () => { btn.textContent = this.toggleMute() ? "🔇" : "🔊"; });
    },
    // animations
    shake(el) { if (!el) return; el.classList.remove("is-shake"); void el.offsetWidth; el.classList.add("is-shake"); setTimeout(() => el.classList.remove("is-shake"), 480); },
    pop(el) { if (!el) return; el.classList.remove("is-pop"); void el.offsetWidth; el.classList.add("is-pop"); },
    confetti(n) {
      const em = ["⭐", "🎉", "✨", "🌟", "💫", "🎈"];
      const count = n || 26;
      for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "confetti";
        s.textContent = em[i % em.length];
        s.style.left = Math.random() * 100 + "vw";
        s.style.animationDuration = 2 + Math.random() * 1.8 + "s";
        s.style.fontSize = 16 + Math.random() * 16 + "px";
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 4200);
      }
    },
    burst(emoji, x, y) {
      const s = document.createElement("div");
      s.className = "burst";
      s.textContent = emoji || "⭐";
      s.style.left = (x || window.innerWidth / 2) + "px";
      s.style.top = (y || window.innerHeight / 2) + "px";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 750);
    },
    // header star bar: fills `filled` of `total`, pops the latest
    renderStars(el, filled, total) {
      if (!el) return;
      el.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const s = document.createElement("span");
        s.className = "s";
        s.textContent = i < filled ? "⭐" : "☆";
        if (i === filled - 1) s.classList.add("starpop");
        el.appendChild(s);
      }
    },
  };

  window.AyaKit = AyaKit.init();
})();
