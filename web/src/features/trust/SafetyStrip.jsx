'use client';

// SafetyStrip — a slim trust band answering the parent's #1 unspoken objection
// ("who teaches my child, and is this safe?") right before the pricing section.
// Intentionally short (one tinted band, 3 items) — not a full section. Claims are
// kept honest and reuse what the dashboard/FAQ already promise (parent control +
// cancel anytime). Colors come from the live MUI theme.

import { Box, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdVerifiedUser, MdHealthAndSafety, MdFamilyRestroom } from 'react-icons/md';
import Section from '@/shared/ui/sections/Section.jsx';
import { brandTextColor } from '@/shared/ui/brandText.js';
import { useTranslation } from '@/i18n/client.js';

const ICONS = [MdVerifiedUser, MdHealthAndSafety, MdFamilyRestroom];

const CONTENT = {
  ar: {
    eyebrow: 'الأمان أولاً',
    title: 'بيئة آمنة يطمئن إليها كل وليّ أمر',
    items: [
      { t: 'معلّم واحد ثابت لطفلك', d: 'معلّم مخصّص يرافق طفلك في كل حصة بلطفٍ وصبر.' },
      { t: 'حصص آمنة وموجّهة', d: 'جلسات هادئة ومناسبة للأطفال تمامًا.' },
      { t: 'أنت المتحكّم دائمًا', d: 'تابع طفلك من لوحة ولي الأمر، وألغِ في أي وقت.' },
    ],
  },
  en: {
    eyebrow: 'Safety first',
    title: 'A safe space every parent can trust',
    items: [
      { t: 'One dedicated teacher', d: 'A consistent teacher who guides your child every session, gently and patiently.' },
      { t: 'Safe, guided sessions', d: 'Calm, fully kid-appropriate lessons.' },
      { t: 'You stay in control', d: 'Follow along from the parent dashboard, cancel anytime.' },
    ],
  },
};

export default function SafetyStrip() {
  const theme = useTheme();
  const { lng } = useTranslation();
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Section id="safety" sx={{ py: { xs: 5, md: 7 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Typography sx={{ color: brandTextColor, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 13, mb: 1 }}>
          {c.eyebrow}
        </Typography>
        <Typography variant="h4" component="h2" fontWeight={800}>
          {c.title}
        </Typography>
      </Box>

      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 2.5, md: 3.5 },
          border: '1px solid',
          borderColor: (th) => alpha(th.palette.primary.main, 0.25),
          bgcolor: (th) => alpha(th.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.12),
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 2.5, sm: 3 },
        }}
      >
        {c.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <Stack key={item.t} direction="row" spacing={1.75} alignItems="flex-start">
              <Box
                sx={{
                  flexShrink: 0,
                  width: 46,
                  height: 46,
                  borderRadius: 2.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'primary.main',
                  bgcolor: (th) => alpha(th.palette.primary.main, 0.14),
                }}
              >
                <Icon size={24} aria-hidden />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} sx={{ mb: 0.25 }}>
                  {item.t}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {item.d}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Section>
  );
}
