'use client';

import { Box, Typography } from '@mui/material';

// One metric cell inside a child card's ACTIVE stats strip.
export default function ChildMetric({ value, label, color }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography
        variant="h6"
        fontWeight={900}
        color={color}
        sx={{ lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
