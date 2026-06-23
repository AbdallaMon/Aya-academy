import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Level } from '../type';

export function LevelCard({ level }: { level: Level }) {
  const LevelIcon = level.icon;
  const BadgeIcon = level.reward.icon;
  return (
    <Box
      sx={{
        height: '100%',
      }}
    >
      <Card
        sx={{
          position: 'relative',
          height: '100%',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            height: '8px',
            width: '100%',
            backgroundColor: level.color,
          }}
        />

        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Level {level.number}
                </Typography>

                <Typography variant="h6">{level.title}</Typography>
              </Box>
              <Box sx={{ color: level.color }}>
                <LevelIcon size={32} />
              </Box>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="subtitle1" color={level.color} gutterBottom>
            {level.ageRange}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {level.description}
          </Typography>
          <Box
            mt={2}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'secondary.main',
            }}
          >
            <BadgeIcon
              size={24}
              style={{ verticalAlign: 'middle', marginRight: 8 }}
            />
            <Typography variant="body2" component="span">
              {level.reward.text}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
