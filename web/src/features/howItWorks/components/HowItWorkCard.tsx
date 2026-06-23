import { Step } from '@/features/howItWorks/types';
import { PageTheme } from '@/shared/types/general';
import { getCurrentColorScheme } from '@/shared/utlis/constants';
import {
  alpha,
  Box,
  Card,
  CardContent,
  IconButton,
  lighten,
  Typography,
} from '@mui/material';

export function HowItWorkCard({
  step,
  pageTheme,
  index,
}: {
  step: Step;
  pageTheme: PageTheme;
  index: number;
}) {
  const Icon = step.icon;
  const colors = getCurrentColorScheme(pageTheme);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -24,
          right: -16,
          fontWeight: 'bold',
          fontSize: 18,
          color: 'white',
          borderRadius: '50%',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          zIndex: 1,
        }}
      >
        {index + 1}
      </Box>
      <Card
        sx={{
          height: '100%',
          backgroundColor: 'background.default',
        }}
      >
        <CardContent>
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: lighten(colors.primary, 0.85),
              color: 'primary.contrastText',
              borderRadius: '12px',
              mb: 2,
            }}
          >
            <Icon size={36} color={colors.primary} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              {step.title}
            </Typography>
            <Typography variant="body2">{step.description}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
