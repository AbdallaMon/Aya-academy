"use client";

// ConfirmProvider — imperative confirmation dialogs, app-wide.
//
// Replaces window.confirm/alert. Usage from any component:
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: "Delete user?",
//     description: "This cannot be undone.",
//     intent: "danger",
//     confirmText: "Delete",
//   });
//   if (!ok) return;
//
// The returned promise resolves to `true` (confirmed) or `false` (cancelled).

import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "../shared/components/dialogs/ConfirmDialog.jsx";

const ConfirmContext = createContext(null);

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: {} });
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const settle = useCallback((value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        intent={state.options.intent}
        title={state.options.title}
        description={state.options.description}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        maxWidth={state.options.maxWidth}
        icon={state.options.icon}
        onCancel={() => settle(false)}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
