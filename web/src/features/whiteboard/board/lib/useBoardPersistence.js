import { useCallback, useMemo, useRef } from "react";
import { boardChannel } from "./boardChannel.js";

// Restores the saved scene (elements + images + view) and returns a debounced
// onChange that persists them. Keyed by sessionKey (session id or token).
//
// IMPORTANT: Excalidraw stores inserted images as separate BINARY FILES, not on
// the elements. onChange's 3rd arg is that files map — we MUST persist it too,
// otherwise a refresh keeps the image frame but loses its picture. We restore via
// initialData.files.
export function useBoardPersistence(sessionKey) {
  const timer = useRef(null);

  const initialData = useMemo(() => {
    const saved = sessionKey ? boardChannel.loadScene(sessionKey) : null;
    if (!saved) return null;
    return {
      elements: saved.elements ?? [],
      appState: { ...(saved.appState ?? {}), collaborators: undefined },
      files: saved.files ?? undefined,
      scrollToContent: true,
    };
  }, [sessionKey]);

  const onChange = useCallback(
    (elements, appState, files) => {
      if (!sessionKey) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        boardChannel.saveScene(sessionKey, {
          elements,
          files: files ?? undefined,
          // Persist only stable view/theme bits, not transient UI/pointer state.
          appState: {
            viewBackgroundColor: appState?.viewBackgroundColor,
            theme: appState?.theme,
            zoom: appState?.zoom,
            scrollX: appState?.scrollX,
            scrollY: appState?.scrollY,
          },
        });
      }, 500);
    },
    [sessionKey],
  );

  return { initialData, onChange };
}
