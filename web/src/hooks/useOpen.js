"use client";

import { useState } from "react";

// Tiny open/close helper used by modals, dialogs and menus.
export function useOpen(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle, setIsOpen };
}
