// WhyAyah — one merged "who we are / how it works / levels" section that replaces
// the old About + HowItWorks + Levels + WhyAyah (which all repeated the same
// "bilingual / kid-friendly / progress & badges" value props). Three internal
// bands with their own rhythm so the page no longer reads as five identical
// heading+grid blocks. Anchors preserved: section #why-ayah, bands #how-it-works
// and #levels (the navbar links to these). The copy and layout are static, so the
// locale is passed from the route and the whole section renders on the server.

import { Box, Chip, Stack, Typography } from '@mui/material';
import { TbWorld } from 'react-icons/tb';
import { FiHeart, FiBookOpen } from 'react-icons/fi';
import { MdOutlinePersonAddAlt, MdStar } from 'react-icons/md';
import { IoVideocamOutline } from 'react-icons/io5';
import { PiHeadphonesLight } from 'react-icons/pi';
import { SlBadge } from 'react-icons/sl';
import Section from '@/shared/ui/sections/Section.jsx';
import Eyebrow from '@/shared/ui/Eyebrow.jsx';

const DIFF_ICONS = [TbWorld, FiHeart, FiBookOpen];
const STEP_ICONS = [MdOutlinePersonAddAlt, IoVideocamOutline, PiHeadphonesLight, SlBadge];
const ACCENTS = [
  { main: '#F6C453', text: '#7A5700', badge: '#7A5700', soft: 'rgba(246, 196, 83, 0.14)', shadow: 'rgba(246, 196, 83, 0.16)' },
  { main: '#1ABC9C', text: '#0A6F60', badge: '#0A6F60', soft: 'rgba(26, 188, 156, 0.14)', shadow: 'rgba(26, 188, 156, 0.16)' },
  { main: '#1E6F5C', text: '#1E6F5C', badge: '#1E6F5C', soft: 'rgba(30, 111, 92, 0.14)', shadow: 'rgba(30, 111, 92, 0.16)' },
  { main: '#E74C3C', text: '#B42318', badge: '#B42318', soft: 'rgba(231, 76, 60, 0.14)', shadow: 'rgba(231, 76, 60, 0.16)' },
];

const CONTENT = {
  ar: {
    eyebrow: 'لماذا آية',
    title: 'رحلة قرآن مبسَّطة لكل طالب',
    slogan: 'القرآن بما يناسب لغة الطالب — مستويات واضحة، إيقاع لطيف، وتقدّم تراه بنفسك.',
    diffs: [
      { t: 'شرح بما يناسب لغة الطالب', d: 'كل درس يُشرح باللغة التي تناسب الطالب.' },
      { t: 'إيقاع مناسب للطالب', d: 'دروس قصيرة وتكرار لطيف بلا ضغط.' },
      { t: 'المعنى لا الحفظ فقط', d: 'يفهمون ما يتلونه، لا أن يحفظوه فقط.' },
    ],
    howTitle: 'كيف تعمل أكاديمية آية؟',
    howSub: 'أربع خطوات بسيطة من التسجيل إلى أول وسام 🌟',
    steps: [
      { t: 'سجّل واختر المستوى', d: 'أخبرنا بعمر الطالب ونضعه في المستوى المناسب.' },
      { t: 'دروس مباشرة أو موجّهة', d: 'جلسات مباشرة أو دروس قصيرة بشرح واضح.' },
      { t: 'تدرّب وكرّر وأتقِن', d: 'تلاوة بطيئة وتمارين صوتية تبني الثقة.' },
      { t: 'اجمع النجوم والأوسمة', d: 'يفتح الطلاب أوسمة كلّما تعلّموا أكثر.' },
    ],
    levelsTitle: 'مستويات لكل عمر',
    levels: [
      { title: 'مبتدئ', age: '٥–٦ سنوات', desc: 'الحروف والأصوات وسور قصيرة بسيطة.', reward: 'وسام أول سورة' },
      { title: 'مستكشف', age: '٧–٨ سنوات', desc: 'سور قصيرة وأساسيات القراءة ومعانٍ سهلة.', reward: 'وسام المستكشف' },
      { title: 'بنّاء', age: '٩–١١ سنة', desc: 'سور أطول وتجويد أقوى ومعانٍ أساسية.', reward: 'وسام البنّاء' },
      { title: 'قارئ واثق', age: '١٢ سنة فأكثر', desc: 'تلاوة طليقة وفهم أعمق.', reward: 'وسام إتقان القرآن' },
    ],
  },
  en: {
    eyebrow: 'Why Ayah',
    title: 'Quran learning made simple for every student',
    slogan: 'Quran in the language that suits the student — clear levels, a gentle pace, and progress you can see.',
    diffs: [
      { t: 'Taught in your language', d: 'Every lesson explained in the language that suits the student.' },
      { t: 'Student-friendly pacing', d: 'Short lessons, gentle repetition, no pressure.' },
      { t: 'Meaning, not just memorizing', d: 'They understand what they recite, not just memorize.' },
    ],
    howTitle: 'How Ayah Academy works',
    howSub: 'Four simple steps from sign-up to the first badge 🌟',
    steps: [
      { t: 'Sign up & pick a level', d: "Tell us the student’s age — we match the right level." },
      { t: 'Live or guided lessons', d: 'Live sessions or short lessons with clear explanations.' },
      { t: 'Practice, recite, repeat', d: 'Slow recitation and audio practice build confidence.' },
      { t: 'Earn stars & badges', d: 'Students unlock badges as they learn more.' },
    ],
    levelsTitle: 'Levels for every age',
    levels: [
      { title: 'Beginner', age: 'Ages 5–6', desc: 'Letters, basic sounds and simple short Surahs.', reward: 'First Surah badge' },
      { title: 'Explorer', age: 'Ages 7–8', desc: 'Short Surahs, reading basics and easy meanings.', reward: 'Explorer badge' },
      { title: 'Builder', age: 'Ages 9–11', desc: 'Longer Surahs, stronger tajweed, key themes.', reward: 'Builder badge' },
      { title: 'Confident reader', age: 'Ages 12+', desc: 'Fluent recitation and deeper understanding.', reward: 'Quran mastery badge' },
    ],
  },
};

export function WhyAyah({ lng = 'en' }) {
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];

  return (
    <Section id="why-ayah">
      {/* ── Band 1: who we are (asymmetric, not a card grid) ──────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
          gap: { xs: 3, md: 6 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Typography variant="h2" sx={{ mb: 2 }}>
            {c.title}
          </Typography>
          <Typography component="p" variant="h6" sx={{ fontWeight: 500, color: 'text.secondary', lineHeight: 1.7 }}>
            {c.slogan}
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {c.diffs.map((d, i) => {
            const Icon = DIFF_ICONS[i];
            const accent = ACCENTS[(i + 1) % ACCENTS.length];
            return (
              <Stack
                key={d.t}
                direction="row"
                spacing={1.75}
                alignItems="center"
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent.text, bgcolor: accent.soft }}>
                  <Icon size={24} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800}>{d.t}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {d.d}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {/* ── Band 2: how it works (connected timeline on its own tinted
            island, so it reads as a distinct band — not a flat block glued
            to the ones above and below) ───────────────────────────────── */}
      <Box
        id="how-it-works"
        sx={{
          mt: { xs: 8, md: 13 },
          scrollMarginTop: 90,
          borderRadius: { xs: 5, md: 6 },
          p: { xs: 3, md: 6 },
          bgcolor: 'rgba(26, 188, 156, 0.05)',
          border: '1px solid',
          borderColor: 'rgba(26, 188, 156, 0.18)',
        }}
      >
        <Typography variant="h4" component="h3" fontWeight={800} sx={{ textAlign: 'center', mb: 1 }}>
          {c.howTitle}
        </Typography>
        <Typography
          component="p"
          variant="h6"
          sx={{ fontWeight: 400, color: 'text.secondary', textAlign: 'center', mb: { xs: 4, md: 5 } }}
        >
          {c.howSub}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 4, md: 3 }, mt: 2 }}>
          {c.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <Box
                key={s.t}
                sx={{
                  position: 'relative',
                  textAlign: 'center',
                  px: 2,
                  pt: 4.5,
                  pb: 3,
                  borderRadius: 5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: `0 12px 28px ${accent.shadow}`,
                  height: '100%',
                }}
              >
                {/* playful step number sitting on the card's top edge (RTL-safe
                    centering: inset-inline 0 + auto margins, no translateX which
                    the RTL plugin would flip) */}
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: -16,
                    insetInline: 0,
                    mx: 'auto',
                    width: 'fit-content',
                    minWidth: 32,
                    height: 32,
                    px: 1,
                    borderRadius: 999,
                    bgcolor: accent.badge,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 900,
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: `0 6px 14px ${accent.shadow}`,
                    border: '3px solid',
                    borderColor: 'background.paper',
                  }}
                >
                  {i + 1}
                </Box>
                {/* soft pastel icon bubble — friendlier than the repeated teal
                    gradient, and a different cheerful colour per step */}
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    color: accent.text,
                    bgcolor: accent.soft,
                  }}
                >
                  <Icon size={32} />
                </Box>
                <Typography component="h4" variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                  {s.t}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {s.d}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Band 3: levels for every age (slim card row) ─────────── */}
      <Box id="levels" sx={{ mt: { xs: 8, md: 13 }, scrollMarginTop: 90 }}>
        <Typography variant="h4" component="h3" fontWeight={800} sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          {c.levelsTitle}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {c.levels.map((level, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <Box
                key={level.title}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderTop: `4px solid ${accent.main}`,
                  boxShadow: `0 10px 26px ${accent.shadow}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent.text, bgcolor: accent.soft }}>
                    <SlBadge size={22} />
                  </Box>
                  <Chip size="small" label={level.age} sx={{ fontWeight: 700, bgcolor: accent.soft, color: accent.text }} />
                </Stack>
                <Typography component="h4" variant="h6" fontWeight={800}>
                  {level.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5, lineHeight: 1.6, flex: 1 }}>
                  {level.desc}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: accent.text }}>
                  <MdStar />
                  <Typography variant="caption" fontWeight={800}>
                    {level.reward}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Section>
  );
}

export default WhyAyah;
