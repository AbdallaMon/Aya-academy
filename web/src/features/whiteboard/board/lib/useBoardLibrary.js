"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRequest } from "../../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL } from "../../config/constant.js";

// Excalidraw's library adapter reads the latest server copy before every save
// and merges changes by item id. This keeps one admin's imported shapes shared
// across all of their whiteboard sessions (and across browser refreshes).
export function useBoardLibraryAdapter(enabled) {
  const { fetchData: loadLibrary } = useRequest({
    url: `${WHITEBOARD_URL}/library`,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });
  const { fetchData: saveLibrary } = useRequest({
    url: `${WHITEBOARD_URL}/library`,
    method: "put",
    autoFetch: false,
    syncToUrl: false,
  });

  const loadRef = useRef(loadLibrary);
  const saveRef = useRef(saveLibrary);
  useEffect(() => {
    loadRef.current = loadLibrary;
    saveRef.current = saveLibrary;
  }, [loadLibrary, saveLibrary]);

  return useMemo(() => {
    if (!enabled) return null;
    return {
      async load() {
        const response = await loadRef.current();
        return {
          libraryItems: Array.isArray(response?.data?.libraryItems)
            ? response.data.libraryItems
            : [],
        };
      },
      async save({ libraryItems }) {
        await saveRef.current(null, {
          libraryItems: Array.from(libraryItems ?? []),
        });
      },
    };
  }, [enabled]);
}
