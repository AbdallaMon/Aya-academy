'use client';

import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Small headline stat used in the parent summary strip.
export default function SummaryStat({ icon, value, label, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}
      >
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: (t) =>
              alpha(
                t.palette[color.split('.')[0]]?.main || t.palette.primary.main,
                0.14
              ),
            color,
            width: 44,
            height: 44,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
