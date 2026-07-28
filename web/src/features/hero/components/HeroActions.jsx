'use client';

import Link from 'next/link';
import { Button, Stack } from '@mui/material';
import { GiStarShuriken } from 'react-icons/gi';
import { MdSportsEsports } from 'react-icons/md';

export default function HeroActions({ primaryHref, primaryLabel, secondaryHref, secondaryLabel }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Button
        component={Link}
        href={primaryHref}
        variant="contained"
        size="large"
        startIcon={<GiStarShuriken />}
      >
        {primaryLabel}
      </Button>
      <Button
        component={Link}
        href={secondaryHref}
        variant="outlinedYellow"
        size="large"
        startIcon={<MdSportsEsports />}
      >
        {secondaryLabel}
      </Button>
    </Stack>
  );
}
