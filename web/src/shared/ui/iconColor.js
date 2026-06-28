// iconColor — resolve a brand palette tone to a color string for react-icons
// `color` props. react-icons take a plain string (not MUI `sx`), so authors used
// to hardcode the raw brand hex (#1ABC9C / #F6C453). Going through the theme here
// means any palette change (or a future per-mode tweak) propagates instead of
// leaving stale literals scattered across the app.
//
// Usage:  const theme = useTheme();  <MdCheckCircle color={iconColor(theme)} />
export function iconColor(theme, tone = 'primary') {
  return theme.palette[tone]?.main ?? theme.palette.primary.main;
}

export default iconColor;
