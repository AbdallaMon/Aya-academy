import React from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastStatus = {
  render: string;
  type: ToastType;
  isLoading: boolean;
  autoClose: number;
};

// export
export type TitleDescription = {
  title: string;
  description: string;
};
export type ColorsTokens = {
  // Brand
  primary: string;
  lightPrimary: string;
  accent: string;
  support: string;

  // Surfaces
  background: string; // page background
  paperBackground: string; // cards/modals
  elevatedBackground: string; // hover/raised surfaces
  surface: string; // inputs / subtle surfaces

  // Text
  text: string;
  mutedText: string;
  lightText: string;

  // Utility
  border: string;
  overlay: string;

  // Constants (real colors)
  white: string;
  black: string;
};
