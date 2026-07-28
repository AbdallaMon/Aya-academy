export const colors = {
  // Brand
  primary: '#1ABC9C',
  lightPrimary: '#1abc9c1c',
  accent: '#F6C453',
  support: '#1E6F5C',
  danger: '#E74C3C',
  warning: '#F39C12',

  // Surfaces (LIGHT) - keep your identity
  background: '#ffffff',
  paperBackground: '#F9FBFF',
  elevatedBackground: '#FFFFFF',
  surface: '#FFFFFF',

  // Text
  text: '#25313F',
  // Passes WCAG AA for normal text on both #FFFFFF and #F9FBFF surfaces.
  mutedText: '#566476',
  lightText: '#F0F3F7',

  // Utility
  border: '#E6EEF7',
  overlay: 'rgba(16, 19, 24, 0.45)',

  // Constants
  white: '#FFFFFF',
  black: '#101318',
};

export function getCurrentColorScheme() {
  return colors;
}

export const sectionYPadding = {
  xs: 6,
  md: 8,
};
