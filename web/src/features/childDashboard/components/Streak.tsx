import { Box, Typography } from '@mui/material';
import { StreakType } from '../types';
import { PageTheme } from '@/shared/types/general';

export function Streak({
  streak,
  pageTheme,
}: {
  streak: StreakType;
  pageTheme: PageTheme;
}) {
  const Icon = streak.icon;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        backgroundColor: 'background.default',
        p: 2,
        mt: 3,
        borderRadius: 1,
        border: '1px solid',
        // borderColor: 'divider',
      }}
      color="secondary.main"
    >
      <Icon size={40} color="primary" />
      <Box>
        <Typography variant="h6">
          {streak.days} {streak.days === 1 ? 'day' : 'days'} {streak.title}
        </Typography>{' '}
        <Typography
          sx={{
            color: 'text.secondary',
          }}
          variant="subtitle1"
        >
          {streak.description}
        </Typography>
      </Box>
    </Box>
  );
}
