// Thin transport seam for the whiteboard. Today it persists the drawing scene to
// localStorage and dispatches reactions on a local event bus. Later, swap the
// bodies to emit/subscribe over socket.io (session:<id> room) without touching
// the board components that call these functions.

const SCENE_PREFIX = "whiteboard:";
const reactionListeners = new Set();

export const boardChannel = {
  saveScene(sessionKey, data) {
    if (typeof window === "undefined" || !sessionKey) return;
    try {
      localStorage.setItem(SCENE_PREFIX + sessionKey, JSON.stringify(data));
    } catch {
      /* storage unavailable / quota — board still works in-memory */
    }
  },
  loadScene(sessionKey) {
    if (typeof window === "undefined" || !sessionKey) return null;
    try {
      const raw = localStorage.getItem(SCENE_PREFIX + sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  // reaction: { id, key, studentName? }
  emitReaction(reaction) {
    for (const fn of reactionListeners) fn(reaction);
  },
  onReaction(fn) {
    reactionListeners.add(fn);
    return () => reactionListeners.delete(fn);
  },
};
