'use client';

import Link from 'next/link';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdChildCare, MdSubscriptions } from 'react-icons/md';
import { localePath } from '@/i18n/routing.js';

// First-run guidance: a new parent has no children — give one clear
// "add child → choose a plan" next step instead of an empty card.
export default function NoChildrenCard({ txt, lng }) {
  return (
    <Card sx={{ textAlign: 'center', py: 4, px: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: '50%',
            color: 'primary.main',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            mb: 2,
          }}
        >
          <MdChildCare size={40} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
          {txt.noChildren}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {txt.noChildrenSub}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="center"
        >
          <Button
            variant="contained"
            component={Link}
            href={localePath(lng, '/dashboard/children')}
            startIcon={<MdChildCare />}
            sx={{ fontWeight: 700 }}
          >
            {txt.addFirstChild}
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href={localePath(lng, '/dashboard/subscriptions')}
            startIcon={<MdSubscriptions />}
            sx={{ fontWeight: 700 }}
          >
            {txt.choosePlan}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
