'use client';
import { useThemeToggler } from '@/providers/ThemeToggler';
import { Box, Button } from '@mui/material';
import { FaRegMoon, FaRegSun } from 'react-icons/fa';

export function ThemeSwitch() {
  const { theme, toggleTheme } = useThemeToggler();
  console.log('Current theme in ThemeSwitch:', theme);
  return (
    <Box
      component={Button}
      variant="contained"
      size="small"
      onClick={toggleTheme}
      sx={{
        height: { xs: 35, md: 40 },
        width: { xs: 60, md: 80 },
        backgroundColor:
          theme === 'light' ? 'secondary.main' : 'background.paper',
        border: '2px solid',
        borderColor: theme === 'light' ? 'secondary.main' : 'primary.main',
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: { xs: -10, md: -7 },
          left: 2,
          width: 25,
          height: 25,
          borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'all 0.3s ease',
          zIndex: 1,
          transform: {
            xs:
              'translateY(50%) translateX(' +
              (theme === 'light' ? '0' : 'calc(100% + 5px)') +
              ')',
            md:
              'translateY(50%) translateX(' +
              (theme === 'light' ? '0' : 'calc(100% + 20px)') +
              ')',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            color: 'secondary.main',
            display: theme === 'light' ? 'block' : 'none',
          }}
        >
          <FaRegSun size={20} />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            color: 'primary.main',
            display: theme === 'dark' ? 'block' : 'none',
          }}
        >
          <FaRegMoon size={20} />
        </Box>
      </Box>
    </Box>
  );
}
