import { useCallback, useMemo, useRef } from "react";
import { boardChannel } from "./boardChannel.js";

// Restores the saved scene and returns a debounced onChange that persists the
// elements + a light appState subset. Keyed by sessionKey (session id or token).
export function useBoardPersistence(sessionKey) {
  const timer = useRef(null);

  const initialData = useMemo(() => {
    const saved = sessionKey ? boardChannel.loadScene(sessionKey) : null;
    if (!saved) return null;
    return {
      elements: saved.elements ?? [],
      appState: { ...(saved.appState ?? {}), collaborators: undefined },
      scrollToContent: true,
    };
  }, [sessionKey]);

  const onChange = useCallback(
    (elements, appState) => {
      if (!sessionKey) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        boardChannel.saveScene(sessionKey, {
          elements,
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
