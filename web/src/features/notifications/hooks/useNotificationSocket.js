"use client";

// useNotificationSocket — connects the singleton notification socket (browser
// only) and calls `onNew` whenever a "notification:new" event arrives. Also
// arms the one-time audio unlock so a later chime is allowed to play. Cleans up
// its subscription on unmount.

import { useEffect, useRef } from "react";
import {
  getNotificationSocket,
  onNewNotification,
} from "../lib/notificationSocket.js";
import { unlockNotificationAudio } from "../lib/notificationSound.js";

export function useNotificationSocket(onNew) {
  // Keep the latest callback without re-subscribing on every render.
  const handlerRef = useRef(onNew);
  useEffect(() => {
    handlerRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    unlockNotificationAudio();
    getNotificationSocket(); // ensure the singleton is connecting

    const unsubscribe = onNewNotification((payload) => {
      handlerRef.current?.(payload);
    });

    return unsubscribe;
  }, []);
}
