import { alpha, Box, Typography } from '@mui/material';
import { Badge } from '../types';
import { PageTheme } from '@/shared/types/general';
import { getCurrentColorScheme } from '@/shared/utlis/constants';

export function RecentBadges({
  badges,
  pageTheme,
}: {
  badges: Badge[];
  pageTheme: PageTheme;
}) {
  const colors = getCurrentColorScheme(pageTheme);
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mt: 4,
      }}
    >
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        const currentColor =
          badge.type === 'primary'
            ? colors.primary
            : badge.type === 'secondary'
              ? colors.accent
              : colors.lightPrimary;
        return (
          <Box
            key={'badge-' + index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',

              gap: 2,
              mb: 2,
              backgroundColor: alpha(currentColor, 0.2),
              py: 2,
              px: 3,
              width: 'fit-content',
              borderRadius: 2,
            }}
          >
            <Icon size={40} color={currentColor} />
            <Box>
              <Typography>{badge.name}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
