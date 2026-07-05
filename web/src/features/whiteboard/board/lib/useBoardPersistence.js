import { useCallback, useMemo, useRef } from "react";
import { boardChannel } from "./boardChannel.js";
import { uploadBoardImage, hydrateBoardFiles } from "./boardImages.js";

// Persists the board across refresh and manages inserted images.
//
// Private admin board (canUpload + sessionId): images are uploaded to the backend
// and localStorage keeps only { fileId: { url, mimeType } } — small + durable.
// Public board (no upload): images fall back to base64 in localStorage.
//
// opts: { sessionId, canUpload, token }
export function useBoardPersistence(sessionKey, opts = {}) {
  const { sessionId, canUpload = false, token = null } = opts;

  const timer = useRef(null);
  const imageMapRef = useRef(null);
  const uploadingRef = useRef(new Set());
  const lastScene = useRef({ elements: [], appState: {} });

  const saved = useMemo(
    () => (sessionKey ? boardChannel.loadScene(sessionKey) : null),
    [sessionKey],
  );
  if (imageMapRef.current === null) {
    imageMapRef.current = saved?.imageMap ? { ...saved.imageMap } : {};
  }

  const initialData = useMemo(() => {
    if (!saved) return null;
    return {
      elements: saved.elements ?? [],
      appState: { ...(saved.appState ?? {}), collaborators: undefined },
      // Upload mode rebuilds files via hydrate(); public mode restores base64.
      files: canUpload ? undefined : saved.files ?? undefined,
      scrollToContent: true,
    };
  }, [saved, canUpload]);

  const persistNow = useCallback(() => {
    if (!sessionKey) return;
    const { elements, appState, files } = lastScene.current;
    boardChannel.saveScene(sessionKey, {
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
    });
  }, [sessionKey, canUpload]);

  const onChange = useCallback(
    (elements, appState, files) => {
      if (!sessionKey) return;
      lastScene.current = { elements, appState, files };

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(persistNow, 500);

      // Upload any newly-inserted images (private board only).
      if (canUpload && sessionId && files) {
        for (const [fileId, file] of Object.entries(files)) {
          if (imageMapRef.current[fileId] || uploadingRef.current.has(fileId)) continue;
          if (!file?.dataURL) continue;
          uploadingRef.current.add(fileId);
          uploadBoardImage(sessionId, file)
            .then((ref) => {
              imageMapRef.current[fileId] = { url: ref.url, mimeType: ref.mimeType };
              uploadingRef.current.delete(fileId);
              persistNow();
            })
            .catch(() => uploadingRef.current.delete(fileId));
        }
      }
    },
    [sessionKey, canUpload, sessionId, persistNow],
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
    [canUpload, token],
  );

  return { initialData, onChange, hydrate };
}
