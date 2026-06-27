"use client";

// Toast layer built on react-toastify (already a project dependency).
//
// Exposes a `useToast()` hook with a `showToast` API compatible with how
// useRequest calls it:
//   showToast({ id, message, severity, translationKey })
//
// `message` is a language-neutral CODE; we resolve it to a localized string via
// the i18n `messagesCodes` table using the fallback chain:
//   table[translationKey][code] -> table.generalMessages[code]
//     -> ANY namespace that defines [code] -> raw code
//
// The global (any-namespace) step matters because many codes are thrown with a
// missing or different `translationKey` than the namespace they live under — e.g.
// every Zod validation error goes through `validate()` with translationKey=null,
// and cross-namespace schemas (a user schema using AUTH_INVALID_EMAIL) are common.
// Code VALUES are globally unique across namespaces, so this lookup is unambiguous.
//
// Mount <AppToastContainer /> once near the app root (done in AppProviders).

import { toast, ToastContainer } from "react-toastify";
import { useCallback } from "react";
import { useTranslation } from "../i18n/client.js";
import { getDirection } from "../i18n/settings.js";
import { messagesNames } from "@aya/shared";

const SEVERITY_TO_TYPE = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
  loading: "default",
};

export function useToast() {
  const { t } = useTranslation();

  const resolveMessage = useCallback(
    (message, translationKey) => {
      if (!message) return "";
      const table = t("messagesCodes", { returnObjects: true }) || {};
      if (!table || typeof table !== "object") return message;

      // 1) exact namespace stamped on the response
      const scoped = table[translationKey]?.[message];
      if (scoped != null) return scoped;

      // 2) general namespace
      const general = table[messagesNames.generalMessages]?.[message];
      if (general != null) return general;

      // 3) global fallback: any namespace that defines this code (values are
      //    globally unique, so this resolves codes thrown with a null/wrong key)
      for (const ns of Object.keys(table)) {
        const hit = table[ns]?.[message];
        if (hit != null) return hit;
      }

      // 4) not a known code — return as-is (already-localized text or unknown)
      return message;
    },
    [t],
  );

  const showToast = useCallback(
    ({ id, message, severity = "info", translationKey, autoClose = 3000 }) => {
      const rendered = resolveMessage(message, translationKey);
      const type = SEVERITY_TO_TYPE[severity] ?? "info";

      // Loading toast that later updates in place (mutations).
      if (severity === "loading") {
        if (id && toast.isActive(id)) {
          toast.update(id, { render: rendered, isLoading: true });
          return id;
        }
        return toast.loading(rendered, { toastId: id });
      }

      // If an existing (loading) toast carries this id, settle it in place.
      if (id && toast.isActive(id)) {
        toast.update(id, {
          render: rendered,
          type,
          isLoading: false,
          autoClose,
        });
        return id;
      }

      return toast(rendered, { toastId: id, type, autoClose });
    },
    [resolveMessage],
  );

  return { showToast, toast };
}

// Toast viewport — direction follows the active language so toasts sit on the
// correct side in RTL.
export function AppToastContainer() {
  const { lng } = useTranslation();
  return (
    <ToastContainer
      position="top-center"
      rtl={getDirection(lng) === "rtl"}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="colored"
      autoClose={3000}
    />
  );
}
