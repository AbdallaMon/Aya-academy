// Thin transport seam for the whiteboard.
// - localStorage is the primary cache for fast reads/writes during the session.
// - Backend is called silently to persist the drawing scene so it survives across
//   devices/browsers. On session open, the backend is checked first and its data
//   is used to seed localStorage.
// - Reactions remain on a local event bus.

import { config } from '../../../../config/config.js';

const SCENE_PREFIX = 'whiteboard:';
const reactionListeners = new Set();
const API = config.api.baseUrl;
export const boardChannel = {
  saveScene(sessionKey, data) {
    if (typeof window === 'undefined' || !sessionKey) return;
    try {
      localStorage.setItem(SCENE_PREFIX + sessionKey, JSON.stringify(data));
    } catch {
      /* storage unavailable / quota — board still works in-memory */
    }
  },

  loadScene(sessionKey) {
    if (typeof window === 'undefined' || !sessionKey) return null;
    try {
      const raw = localStorage.getItem(SCENE_PREFIX + sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    } finally {
    }
  },

  // ── backend persistence (silent — never throws) ──────────
  // Save the drawing scene to the backend. sessionId is the numeric DB id.
  // Called silently; failures are swallowed so the board never breaks.
  async saveToBackend(sessionId, boardData, setIsSaving, token) {
    if (typeof window === 'undefined' || !sessionId) return;
    setIsSaving(true);
    try {
      await fetch(`${API}/whiteboard-sessions/${sessionId}/board-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Whiteboard-Token': token } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ boardData }),
      });
    } catch {
      /* network hiccup — next save will retry */
    } finally {
      setIsSaving(false);
    }
  },

  // Load the drawing scene from the backend. Returns the boardData JSON or null.
  // `token` is passed for public boards (X-Whiteboard-Token header).
  async loadFromBackend(sessionId, token) {
    if (typeof window === 'undefined' || (!sessionId && !token)) return null;
    try {
      const res = await fetch(
        `${API}/whiteboard-sessions/${sessionId}/board-data`,
        {
          credentials: 'include',
          headers: token ? { 'X-Whiteboard-Token': token } : undefined,
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.log(e.message, 'loadFromBackend error');
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
