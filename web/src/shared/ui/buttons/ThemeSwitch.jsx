'use client';

// Theme toggle — a clean sun/moon icon button (portfolio style). Uses NO
// physical left/right or transforms, so it is fully RTL-safe (the previous
// sliding-knob version moved the wrong way in Arabic/RTL). Mode comes from the
// ThemeToggler context, so toggling is instant (no reload).

import { IconButton } from '@mui/material';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useThemeToggler } from '@/providers/ThemeToggler';

export function ThemeSwitch() {
  const { theme, toggleTheme } = useThemeToggler();
  const isDark = theme === 'dark';

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      size="medium"
      sx={{
        color: isDark ? 'secondary.main' : 'primary.main',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all .2s ease',
        '&:hover': {
          borderColor: isDark ? 'secondary.main' : 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </IconButton>
  );
}

export default ThemeSwitch;
