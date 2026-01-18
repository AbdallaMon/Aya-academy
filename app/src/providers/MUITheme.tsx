'use client';

import { getCurrentColorScheme } from '@/shared/utlis/constants';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme, alpha, darken, lighten } from '@mui/material/styles';
import { PageTheme } from '@/shared/types/general';

// Extend MUI theme types
declare module '@mui/material/styles' {
  interface TypeBackground {
    white: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    outlinedYellow: true;
  }
}

function buildTheme({
  direction = 'ltr',
  mode = 'light',
}: {
  direction?: 'ltr' | 'rtl';
  mode?: 'light' | 'dark';
}): ReturnType<typeof createTheme> {
  const base = getCurrentColorScheme(mode);
  const primaryMain = base.primary;
  const primaryLight = lighten(primaryMain, 0.15);
  const primaryDark = darken(primaryMain, 0.15);

  const secondaryMain = base.accent;
  const secondaryLight = lighten(secondaryMain, 0.12);
  const secondaryDark = darken(secondaryMain, 0.12);

  const backgroundDefault = base.background;
  const backgroundPaper = base.paperBackground;

  const textPrimary = base.text;
  const textSecondary = base.mutedText;

  return createTheme({
    direction,

    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: primaryLight,
        dark: primaryDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: secondaryMain,
        light: secondaryLight,
        dark: secondaryDark,
        contrastText: '#25313F',
      },
      success: {
        main: base.support,
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
        white: base.white,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
        disabled: alpha(textSecondary, 0.4),
      },
      common: {
        white: base.white,
        black: base.black,
      },
      info: {
        main: base.accent,
      },

      action: {
        hover: alpha(primaryMain, 0.06),
        selected: alpha(primaryMain, 0.14),
        disabled: alpha(primaryMain, 0.3),
        disabledBackground: alpha(primaryMain, 0.08),
        focus: alpha(primaryMain, 0.24),
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    colorSchemes: {},
    typography: {
      fontFamily: ['Nunito', 'system-ui', 'sans-serif'].join(','),
      h1: {
        fontWeight: 800,
        fontSize: '2.4rem',
        letterSpacing: '-0.03em',
        color: textPrimary,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        letterSpacing: '-0.02em',
        color: textPrimary,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.6rem',
        color: textPrimary,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.4rem',
        color: textPrimary,
      },
      body1: {
        fontSize: '1rem',
        color: textSecondary,
      },
      body2: {
        fontSize: '0.9rem',
        color: textSecondary,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },

    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: backgroundPaper,
          },
        },
      },

      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            colorScheme: mode,
          },
          body: {
            margin: 0,
            padding: 0,
            backgroundColor: backgroundDefault,
            color: textPrimary,
            direction,
          },
          '::selection': {
            backgroundColor: base.accent,
            color: base.black,
          },
          '::-moz-selection': {
            backgroundColor: base.accent,
            color: base.black,
          },
          '*::-webkit-scrollbar': {
            width: 10,
            height: 10,
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(primaryMain, 0.3),
            borderRadius: 8,
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: alpha(primaryMain, 0.06),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: backgroundPaper,
          },
        },
      },
      MuiButton: {
        variants: [
          {
            props: { variant: 'outlinedYellow' },
            style: {
              borderColor: base.accent,
              color: base.accent,
              backgroundColor: base.white,
              border: '1px solid',
              '&:hover': {
                borderColor: base.accent,
                backgroundColor: alpha(base.accent, 0.08),
              },
            },
          },
        ],
        defaultProps: {
          disableElevation: true,
        },

        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            paddingBlock: 10,
          },
          contained: {
            color: base.lightText,
          },
          // outlinedYellow:{

          // },
          // i want to make new varaint outlined yellow extend outline and have yellow border and text

          text: {
            color: textPrimary,
          },
          containedPrimary: {
            boxShadow: `0 8px 18px ${alpha(primaryMain, 0.25)}`,
            color: base.lightText,
          },
          outlined: {
            borderColor: alpha(primaryMain, 0.5),
            color: textPrimary,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: primaryMain,
            textDecoration: 'none',
            transition: '0.3s',
            '&:hover': {
              color: primaryDark,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: `0 4px 12px ${alpha(primaryMain, 0.08)}`,
            backgroundColor:
              mode === 'light' ? base.white : alpha('#000000', 0.1),
          },
          notchedOutline: {
            borderColor: alpha(primaryMain, 0.25),
          },
          input: {
            '::placeholder': {
              opacity: 0.7,
            },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: alpha(textPrimary, 0.7),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          colorPrimary: {
            backgroundColor: alpha(primaryMain, 0.15),
            color: primaryMain,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: base.black,
            color: base.white,
            borderRadius: 8,
            fontSize: 12,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: primaryMain,
              '+ .MuiSwitch-track': {
                backgroundColor: alpha(primaryMain, 0.5),
              },
            },
          },
        },
      },
    },
  });
}

export function MUIThemeProvider({
  children,
  locale = 'en',
  pageTheme,
}: {
  children: React.ReactNode;
  locale?: 'en' | 'ar';
  pageTheme?: PageTheme;
}) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const theme = buildTheme({ direction, mode: pageTheme });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
