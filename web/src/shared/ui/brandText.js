import { darken } from '@mui/material/styles';

// brandTextColor — an sx color callback for TEAL TEXT (section eyebrows, prices,
// inline brand accents). The bright brand teal #1ABC9C is only ~2.4:1 on light
// surfaces (fails WCAG AA), so on light mode we darken it to ~4.9:1; on dark mode
// the bright teal already passes on the navy background, so we keep it.
// Usage:  <Typography sx={{ color: brandTextColor }} />
export function brandTextColor(theme) {
  return theme.palette.mode === 'light'
    ? darken(theme.palette.primary.main, 0.34)
    : theme.palette.primary.main;
}
