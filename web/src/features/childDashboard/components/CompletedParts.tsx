import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { MdCheck } from 'react-icons/md';
import { CompletedPart } from '../types';

export function CompletedParts({
  completedParts,
}: {
  completedParts: CompletedPart[];
}) {
  return (
    <Box>
      {' '}
      <Typography
        variant="subtitle2"
        sx={{
          mt: 3,
          color: 'text.secondary',
          fontWeight: 'bold',
          mb: 2,
        }}
      >
        Parts completed
      </Typography>
      {completedParts.map((part, index) => (
        <Box
          key={'part-' + index}
          component={Paper}
          elevation={1}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 1,
            p: 2,
            backgroundColor: 'background.default',
            borderRadius: 1,
          }}
        >
          <Typography>{part.name}</Typography>
          {part.progress === 100 ? (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              color="primary.main"
            >
              <Typography color="primary">Completed</Typography>
              <MdCheck />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography color="secondary">{part.progress}</Typography>
              <LinearProgress
                variant="determinate"
                value={part.progress}
                sx={{ width: 100, ml: 1 }}
                color="secondary"
              />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
