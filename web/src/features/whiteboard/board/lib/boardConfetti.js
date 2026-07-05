import confetti from "canvas-confetti";

// canvas-confetti bound to a specific in-board <canvas>, so bursts render even
// when the board is in true fullscreen (a body-level canvas would be hidden by
// the fullscreened element). Pass the canvas once; get back typed effects.
export function createBoardConfetti(canvas) {
  if (!canvas) return { fire() {} };
  const shoot = confetti.create(canvas, { resize: true, useWorker: true });

  const heartShape = confetti.shapeFromText
    ? confetti.shapeFromText({ text: "❤️", scalar: 2 })
    : undefined;

  const effects = {
    // Confetti fountain rising from the bottom center.
    up(color) {
      shoot({
        particleCount: 60,
        startVelocity: 45,
        spread: 70,
        angle: 90,
        origin: { x: 0.5, y: 1 },
        colors: color ? [color, "#ffffff"] : undefined,
      });
    },
    // Two-sided celebratory burst.
    burst(color) {
      const opts = { particleCount: 50, spread: 60, colors: color ? [color, "#ffd700", "#ffffff"] : undefined };
      shoot({ ...opts, angle: 60, origin: { x: 0, y: 0.7 } });
      shoot({ ...opts, angle: 120, origin: { x: 1, y: 0.7 } });
    },
    // Falling hearts.
    hearts() {
      shoot({
        particleCount: 30,
        spread: 100,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.4 },
        shapes: heartShape ? [heartShape] : undefined,
        colors: ["#ff5c8a", "#ff8fab", "#ff2d6f"],
        scalar: 1.6,
        gravity: 0.6,
      });
    },
    // A few staggered firework pops.
    fireworks() {
      const spots = [0.25, 0.5, 0.75];
      spots.forEach((x, i) => {
        setTimeout(() => {
          shoot({
            particleCount: 40,
            spread: 360,
            startVelocity: 30,
            origin: { x, y: 0.4 + (i % 2) * 0.1 },
          });
        }, i * 220);
      });
    },
  };

  return {
    fire(type, color) {
      if (type && effects[type]) effects[type](color);
    },
  };
}
