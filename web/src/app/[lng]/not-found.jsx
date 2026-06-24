'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from '@/i18n/client.js';
import { localePath } from '@/i18n/routing.js';

export default function NotFound() {
  const { lng } = useTranslation();
  const isEn = lng === 'en';
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <Box sx={{ fontSize: 72 }}>🧭</Box>
      <Typography variant="h3" fontWeight={800}>
        404
      </Typography>
      <Typography color="text.secondary">
        {isEn ? 'This page could not be found.' : 'تعذّر العثور على هذه الصفحة.'}
      </Typography>
      <Button variant="contained" component={Link} href={localePath(lng, '/')}>
        {isEn ? 'Back home' : 'العودة للرئيسية'}
      </Button>
    </Box>
  );
}
