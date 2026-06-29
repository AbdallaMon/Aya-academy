'use client';

import { getCurrentColorScheme } from '@/shared/utlis/constants';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme, alpha, darken, lighten } from '@mui/material/styles';
export function buildTheme({ direction = 'ltr', mode = 'light' }) {
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

  // Accessibility (WCAG 1.4.3): bright teal #1ABC9C carries white text at only
  // ~2.4:1 and is itself ~2.4:1 as text on light surfaces — both fail AA. So we
  // derive darker teals that pass: `ctaTeal` for white-on-teal button fills, and
  // `tealText` for teal TEXT (eyebrows/links/prices) on light backgrounds. In
  // dark mode the bright teal already passes on navy, so tealText stays bright.
  const ctaTeal = darken(primaryMain, 0.32); // ~4.8:1 with #FFFFFF
  const ctaTealHover = darken(primaryMain, 0.42);
  const tealText = mode === 'light' ? darken(primaryMain, 0.34) : primaryMain; // ~4.9:1 on white

  // Soft, layered shadows — warmer/cleaner than MUI defaults. In dark mode the
  // surfaces are deep navy, so we lean on darker, slightly tinted shadows.
  const shadowColor = mode === 'light' ? '20, 35, 60' : '0, 0, 0';
  const softShadow1 = `0 1px 2px rgba(${shadowColor}, ${
    mode === 'light' ? 0.06 : 0.4
  }), 0 4px 12px rgba(${shadowColor}, ${mode === 'light' ? 0.05 : 0.35})`;

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
      borderRadius: 14,
    },
    spacing: 8,
    colorSchemes: {},
    typography: {
      fontFamily: 'var(--font-sans), "Cairo", system-ui, sans-serif',
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
          // NOTE: do NOT set `direction` on html/body here. The RTL emotion cache
          // (stylis-plugin-rtl) rewrites a `direction: rtl` declaration into
          // `direction: ltr`, which would force the whole document back to LTR and
          // break every flex/grid layout in Arabic. Direction is governed by the
          // server-rendered `<html dir="rtl">` (set in app/[lng]/layout.jsx).
          body: {
            margin: 0,
            padding: 0,
            backgroundColor: backgroundDefault,
            color: textPrimary,
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
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${
              mode === 'light' ? base.border : alpha('#FFFFFF', 0.06)
            }`,
            boxShadow: softShadow1,
            backgroundImage: 'none',
            transition:
              'box-shadow .25s ease, transform .25s ease, border-color .25s ease',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            '&:last-child': { paddingBottom: 20 },
          },
        },
      },
      MuiButton: {
        variants: [
          {
            // Secondary "play / games" CTA. Was yellow TEXT on a near-white
            // surface (~1.6:1 — effectively invisible in light mode). Now a
            // FILLED warm-amber button with dark slate text (secondary.contrastText
            // #25313F on #F6C453 ≈ 8:1) — readable, on-brand, and a stronger CTA.
            props: { variant: 'outlinedYellow' },
            style: {
              backgroundColor: base.accent,
              // Fixed dark slate (= secondary.contrastText) in BOTH themes: the
              // amber fill is the same light color in light AND dark mode, so the
              // label must always be dark (base.text would be near-white in dark
              // mode → unreadable on amber).
              color: '#25313F',
              border: '1px solid',
              borderColor: base.accent,
              '&:hover': {
                borderColor: darken(base.accent, 0.08),
                backgroundColor: darken(base.accent, 0.08),
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
          text: {
            color: textPrimary,
          },
          // Primary CTA. White text on raw teal #1ABC9C is ~2.4:1 (fails WCAG AA),
          // so the fill is the darker `ctaTeal` (~4.8:1 with pure #FFFFFF) in both
          // light and dark mode (the fill color is the same regardless of page bg).
          containedPrimary: {
            backgroundColor: ctaTeal,
            color: '#FFFFFF',
            boxShadow: `0 8px 18px ${alpha(primaryMain, 0.25)}`,
            '&:hover': {
              backgroundColor: ctaTealHover,
            },
          },
          outlined: {
            borderColor: alpha(primaryMain, 0.5),
            color: textPrimary,
          },
        },
      },
      // Strong, brand-colored focus ring for keyboard users across every
      // button/icon-button/link-button (WCAG 2.4.7) — the default ring is faint
      // on the teal/amber surfaces.
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `3px solid ${mode === 'light' ? tealText : secondaryMain}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: tealText,
            textDecoration: 'none',
            transition: '0.3s',
            '&:hover': {
              color: mode === 'light' ? darken(primaryMain, 0.45) : primaryLight,
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
            borderRadius: 999,
            fontWeight: 700,
            letterSpacing: '0.01em',
          },
          colorPrimary: {
            backgroundColor: alpha(primaryMain, 0.15),
            color: mode === 'light' ? primaryDark : primaryLight,
          },
          colorSecondary: {
            backgroundColor: alpha(secondaryMain, 0.2),
            color: mode === 'light' ? darken(secondaryMain, 0.35) : secondaryMain,
          },
          colorSuccess: {
            backgroundColor: alpha(base.support, 0.18),
            color: mode === 'light' ? base.support : lighten(base.support, 0.35),
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor:
              mode === 'light' ? base.border : alpha('#FFFFFF', 0.08),
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 800,
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
              // Always write the LTR value. The RTL emotion cache
              // (stylis-plugin-rtl) flips `translateX(20px)` -> `translateX(-20px)`
              // for Arabic. Hard-coding the negative value for RTL here used to
              // get flipped a SECOND time by the plugin, so the thumb overshot
              // and slid out of the track.
              transform: 'translateX(20px)',
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

export function MUIThemeProvider({ children, locale = 'en', pageTheme }) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const theme = buildTheme({ direction, mode: pageTheme });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
