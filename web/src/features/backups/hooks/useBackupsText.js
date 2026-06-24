"use client";

import { useCallback, useMemo } from "react";
import { useTranslation } from "../../../i18n/client.js";
import { backupsData, backupMessages } from "../config/backupText.js";

/**
 * useBackupsText — reads the Backups screen strings (backupsData) in the active
 * language.
 *
 * These strings are kept feature-local (in config/backupText.js, NOT a shared
 * i18n namespace), so we read backupsData[lng] directly instead of
 * t("backupsData"). Returns { tr, lng, trMsg } where:
 *  - tr        the screen-string object for the active language.
 *  - trMsg(code) translates a backup message CODE (backupMessagesCodes) to the
 *                active-language string (falls back to the raw code).
 */
export function useBackupsText() {
  const { lng } = useTranslation();
  const tr = useMemo(() => backupsData[lng] || backupsData.ar || {}, [lng]);
  const msgMap = useMemo(
    () => backupMessages[lng] || backupMessages.ar || {},
    [lng],
  );
  const trMsg = useCallback(
    (code) => (code ? msgMap[code] || code : ""),
    [msgMap],
  );
  return { tr, lng, trMsg };
}
