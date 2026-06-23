import {
  Box,
  Card,
  CardContent,
  CardHeader,
  lighten,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import { ChildsDashboardCardType } from '../types';
import { ProgressBorderCircle } from '@/shared/ui/utility/CircleProgress';
import { PageTheme } from '@/shared/types/general';
import { MdCheck } from 'react-icons/md';
import { CompletedParts } from './CompletedParts';
import { RecentBadges } from './RecentBadges';
import { Streak } from './Streak';
import { getCurrentColorScheme } from '@/shared/utlis/constants';

export function ChildDashboardCard({
  card,
  pageTheme,
}: {
  card: ChildsDashboardCardType;
  pageTheme: PageTheme;
}) {
  const colors = getCurrentColorScheme(pageTheme);
  const isLightMode = pageTheme === 'light';
  return (
    <Card
      sx={{
        background: `linear-gradient(to top, ${lighten(isLightMode ? colors.accent : colors.lightPrimary, isLightMode ? 0.6 : 0.6)} 0%, ${lighten(colors.lightPrimary, 0.1)} 100%)`,
      }}
    >
      <CardHeader>{card.title}</CardHeader>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'center',
          }}
        >
          <ProgressBorderCircle
            value={card.progress.total}
            pageTheme={pageTheme}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
              }}
            >
              {card.progress.title}
            </Typography>
            <Typography>{card.progress.subTitle}</Typography>
          </Box>
        </Box>
        <CompletedParts completedParts={card.completedParts} />
        <RecentBadges badges={card.badges} pageTheme={pageTheme} />
        <Streak streak={card.streak} pageTheme={pageTheme} />
      </CardContent>
    </Card>
  );
}
