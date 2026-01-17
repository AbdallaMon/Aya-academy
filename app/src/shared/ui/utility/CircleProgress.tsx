'use client';
import { Box, Typography } from '@mui/material';
import { getCurrentColorScheme } from '@/shared/utlis/constants';
import { PageTheme } from '@/shared/types/general';

type Props = {
  value: number; // 0..100
  size?: number;
  thickness?: number;
  withText?: boolean;
  pageTheme: PageTheme;
};

export function ProgressBorderCircle({
  value,
  size = 64,
  thickness = 8,
  withText = true,
  pageTheme,
}: Props) {
  const v = Math.max(0, Math.min(100, value));
  const colors = getCurrentColorScheme(pageTheme);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: `conic-gradient(${colors.primary} ${value}%, ${colors.white} 0)`,
        p: thickness,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: thickness, // same as ring thickness
          borderRadius: '50%',
          background: colors.paperBackground, // inside fill
        },
      }}
    >
      <Box sx={{ textAlign: 'center', zIndex: 1 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 'bold', color: 'primary.main', lineHeight: 1 }}
        >
          {v}%
        </Typography>
        {withText && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Overall
          </Typography>
        )}
      </Box>
    </Box>
  );
}
