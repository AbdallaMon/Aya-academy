import { Box, Stack, Typography } from '@mui/material';
import { MdVerifiedUser, MdHealthAndSafety, MdFamilyRestroom } from 'react-icons/md';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';

const ICONS = [MdVerifiedUser, MdHealthAndSafety, MdFamilyRestroom];

const CONTENT = {
  ar: {
    eyebrow: 'الأمان أولًا',
    title: 'بيئة آمنة يطمئن إليها كل وليّ أمر',
    items: [
      { t: 'معلّم واحد ثابت للطالب', d: 'معلّم مخصّص يرافق الطالب في كل حصة بلطفٍ وصبر.' },
      { t: 'حصص آمنة وموجّهة', d: 'جلسات هادئة ومناسبة للطلاب تمامًا.' },
      { t: 'أنت المتحكّم دائمًا', d: 'تابع التقدّم من لوحة وليّ الأمر، واطلب تعديل الخطة عبر الدعم.' },
    ],
  },
  en: {
    eyebrow: 'Safety first',
    title: 'A safe space every parent can trust',
    items: [
      { t: 'One dedicated teacher', d: 'A consistent teacher who guides the student every session, gently and patiently.' },
      { t: 'Safe, guided sessions', d: 'Calm, fully student-appropriate lessons.' },
      { t: 'You stay in control', d: 'Follow progress from the parent dashboard and request plan changes through support.' },
    ],
  },
};

// Static reassurance copy does not need the translation/theme hooks. Rendering
// it on the server keeps it in the initial HTML and removes its client bundle.
export default function SafetyStrip({ lng = 'ar' }) {
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <MarketingSection id="safety" eyebrow={c.eyebrow} title={c.title} maxWidth="lg">
      <Box sx={{ borderRadius: 4, p: { xs: 2.5, md: 3.5 }, border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.paper', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 2.5, sm: 3 } }}>
        {c.items.map((item, index) => {
          const Icon = ICONS[index];
          return (
            <Stack key={item.t} direction="row" spacing={1.75} alignItems="flex-start">
              <Box sx={{ flexShrink: 0, width: 46, height: 46, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'background.default' }}>
                <Icon size={24} aria-hidden />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h3" fontWeight={800} sx={{ mb: 0.25 }}>{item.t}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.d}</Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </MarketingSection>
  );
}
