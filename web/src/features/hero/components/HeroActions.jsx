'use client';

import Link from 'next/link';
import { Box, Button, Link as MuiLink, Typography } from '@mui/material';
import { GiStarShuriken } from 'react-icons/gi';
import { MdArrowDownward, MdSportsEsports } from 'react-icons/md';

export default function HeroActions({
  primaryHref,
  primaryLabel,
  pricingLabel,
  freeTrialLabel,
  secondaryHref,
  secondaryLabel,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Button
          component={Link}
          href={primaryHref}
          prefetch={false}
          variant="contained"
          size="large"
          startIcon={<GiStarShuriken />}
          sx={{ flex: 1 }}
        >
          {primaryLabel}
        </Button>
        <Button
          component="a"
          href="#pricing"
          variant="outlinedYellow"
          size="large"
          endIcon={<MdArrowDownward />}
          sx={{ flex: 1 }}
        >
          {pricingLabel}
        </Button>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: { xs: 'center', sm: 'start' } }}
      >
        {freeTrialLabel}
      </Typography>
      <MuiLink
        component={Link}
        href={secondaryHref}
        prefetch={false}
        variant="body2"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: { xs: 'center', sm: 'flex-start' },
          gap: 1,
          mt: 0.5,
          py: 0.5,
          minHeight: 32,
          fontWeight: 700,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: 4,
          },
        }}
      >
        <MdSportsEsports size={20} aria-hidden="true" />
        {secondaryLabel}
      </MuiLink>
    </Box>
  );
}
