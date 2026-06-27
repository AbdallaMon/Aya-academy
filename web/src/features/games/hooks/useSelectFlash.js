"use client";

// useSelectFlash — a transient correct/wrong "flash" for tap-to-select games.
// Kids rule stays intact: this is PURELY a visual effect, it changes no game
// logic. On every pick, fire(key, isCorrect) paints that option green (correct)
// or red (wrong) for a beat, then clears it on its own (< 1s) so the board
// returns to calm. `key` is whatever identifies the tapped option (index / id).

import { useCallback, useEffect, useRef, useState } from "react";

export function useSelectFlash(duration = 600) {
  const [flash, setFlash] = useState(null); // { key, correct } | null
  const timer = useRef(null);

  const fire = useCallback(
    (key, correct) => {
      if (timer.current) clearTimeout(timer.current);
      setFlash({ key, correct });
      timer.current = setTimeout(() => setFlash(null), duration);
    },
    [duration],
  );

  // never leave a timer dangling on unmount (question swap / game exit)
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  // flashFor(key) → true (correct) | false (wrong) | null (no flash on this one)
  const flashFor = useCallback(
    (key) => (flash && flash.key === key ? flash.correct : null),
    [flash],
  );

  return { flash, fire, flashFor };
}
