import { PageTheme } from '../types/general';
import { ColorsTokens } from './types';

export const colors: ColorsTokens = {
  // Brand
  primary: '#1ABC9C',
  lightPrimary: '#1abc9c1c',
  accent: '#F6C453',
  support: '#1E6F5C',

  // Surfaces (LIGHT) - keep your identity
  background: '#ffffff',
  paperBackground: '#F9FBFF',
  elevatedBackground: '#FFFFFF',
  surface: '#FFFFFF',

  // Text
  text: '#25313F',
  mutedText: '#6B7A8C',
  lightText: '#F0F3F7',

  // Utility
  border: '#E6EEF7',
  overlay: 'rgba(16, 19, 24, 0.45)',

  // Constants
  white: '#FFFFFF',
  black: '#101318',
};

export const darkColors: ColorsTokens = {
  // Brand (keep identity)
  primary: '#1ABC9C',
  lightPrimary: '#1abc9c33',
  accent: '#F6C453',
  support: '#1E6F5C',

  // Surfaces (DARK) - Aya “night” feel
  background: '#0B1524', // deep navy
  paperBackground: '#0F1D30', // cards/modals
  elevatedBackground: '#13243B', // hover/raised
  surface: '#122136', // inputs

  // Text
  text: '#EAF1FA',
  mutedText: '#A7B5C9',
  lightText: '#FFFFFF',

  // Utility
  border: '#1E3552',
  overlay: 'rgba(11, 21, 36, 0.82)',

  // Constants (keep literal meaning)
  white: '#FFFFFF',
  black: '#101318',
};
export function getCurrentColorScheme(mode: PageTheme) {
  return mode === 'light' ? colors : darkColors;
}

export const sectionYPadding = {
  xs: 6,
  md: 8,
};
