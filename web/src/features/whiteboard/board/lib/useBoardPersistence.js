import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { boardChannel } from './boardChannel.js';
import { uploadBoardImage, hydrateBoardFiles } from './boardImages.js';

// Persists the board across refresh and manages inserted images.
//
// Strategy:
// 1. On mount: check backend first → seed localStorage → render.
// 2. During session: read from localStorage (fast), save silently to backend.
// 3. If backend fails: localStorage is the authoritative fallback.
//
// Private admin board (canUpload + sessionId): images are uploaded to the backend
// and localStorage keeps only { fileId: { url, mimeType } } — small + durable.
// Public board (no upload): images fall back to base64 in localStorage.
//
// opts: { sessionId, canUpload, token }
export function useBoardPersistence(sessionKey, opts = {}) {
  const { sessionId, canUpload = false, token = null } = opts;

  const timer = useRef(null);
  const imageMapRef = useRef({});
  const uploadingRef = useRef(new Set());
  const lastScene = useRef({ elements: [], appState: {} });
  const [seedCount, setSeedCount] = useState(0);
  const loadingFromBackendRef = useRef(false);
  const hasSession = !!(sessionKey && sessionId);
  const [isSaving, setIsSaving] = useState(false);
  // ── Step 1: load from backend on mount, seed localStorage ──
  useEffect(() => {
    if (!hasSession) return;

    let cancelled = false;
    (async () => {
      loadingFromBackendRef.current = true;
      const backEndReq = await boardChannel.loadFromBackend(sessionId, token);
      if (!backEndReq.success) return;
      const backendData = backEndReq.data;
      if (cancelled) return;
      if (backendData) {
        // Seed localStorage with the backend data so subsequent reads are fast.
        boardChannel.saveScene(sessionKey, backendData);
        // Rebuild the imageMap from the backend payload.
        if (backendData.imageMap) {
          imageMapRef.current = { ...backendData.imageMap };
        }
      }
      loadingFromBackendRef.current = false;
      // Trigger a re-render so the board picks up the seeded data.
      if (!cancelled) setSeedCount((v) => v + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionKey, sessionId, token, hasSession]);

  // ── Step 2: initial data from localStorage (now seeded) ──
  const saved = useMemo(
    () => (hasSession ? boardChannel.loadScene(sessionKey) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionKey, seedCount]
  );

  const initialData = useMemo(() => {
    if (!saved) return null;
    return {
      elements: saved.elements ?? [],
      appState: { ...(saved.appState ?? {}), collaborators: undefined },
      // Upload mode rebuilds files via hydrate(); public mode restores base64.
      files: canUpload ? undefined : (saved.files ?? undefined),
      scrollToContent: true,
    };
  }, [saved, canUpload]);

  // ── Step 3: persist to localStorage (fast) + backend (silent) ──
  const persistNow = useCallback(() => {
    if (!sessionKey) return;
    const { elements, appState, files } = lastScene.current;
    const data = {
      elements,
      appState: {
        viewBackgroundColor: appState?.viewBackgroundColor,
        theme: appState?.theme,
        zoom: appState?.zoom,
        scrollX: appState?.scrollX,
        scrollY: appState?.scrollY,
      },
      imageMap: canUpload ? imageMapRef.current : undefined,
      files: canUpload ? undefined : files,
    };
    // localStorage — always fast
    boardChannel.saveScene(sessionKey, data);
    // Backend — silent, never blocks
    if (sessionId) {
      boardChannel.saveToBackend(sessionId, data, setIsSaving);
    }
  }, [sessionKey, canUpload, sessionId]);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSaving) return;
      e.preventDefault();

      // Required for Chrome and most browsers
      e.returnValue =
        'Unsaved changes may be lost. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving]);
  const onChange = useCallback(
    (elements, appState, files) => {
      if (!sessionKey) return;

      // if (!loadingFromBackendRef || loadingFromBackendRef.current) return;
      lastScene.current = { elements, appState, files };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(persistNow, 500);

      // Upload any newly-inserted images (private board only).
      if (canUpload && sessionId && files) {
        for (const [fileId, file] of Object.entries(files)) {
          if (imageMapRef.current[fileId] || uploadingRef.current.has(fileId))
            continue;
          if (!file?.dataURL) continue;
          uploadingRef.current.add(fileId);
          uploadBoardImage(sessionId, file, token)
            .then((ref) => {
              imageMapRef.current[fileId] = {
                url: ref.url,
                mimeType: ref.mimeType,
              };
              uploadingRef.current.delete(fileId);
              persistNow();
            })
            .catch(() => uploadingRef.current.delete(fileId));
        }
      }
    },
    [sessionKey, canUpload, sessionId, persistNow, token]
  );

  // Called once the Excalidraw API is ready — rebuild images from their URLs.
  const hydrate = useCallback(
    async (api) => {
      if (!canUpload || !api?.addFiles) return;
      const map = imageMapRef.current;
      if (!map || Object.keys(map).length === 0) return;
      const files = await hydrateBoardFiles(map, token);
      if (files.length) api.addFiles(files);
    },
    [canUpload, token]
  );

  return { initialData, onChange, hydrate };
}
