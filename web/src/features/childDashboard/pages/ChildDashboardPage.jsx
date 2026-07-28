// ChildDashboardHome — the ONE honest preview of the real product dashboard a
// parent gets after signing up. It mirrors ONLY features that actually exist in
// the dashboard: a gradient hero (points / level / rank), an active-subscription
// chip with remaining hours, earned badges, and the top-students leaderboard.
// It deliberately does NOT show per-Juz / per-ayah progress, "level progress %",
// or streaks — those are not real features. It has no browser state, so locale
// copy is selected on the server and only native links remain interactive.

import {
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  MdStar,
  MdEmojiEvents,
  MdArrowForward,
  MdAccessTimeFilled,
} from 'react-icons/md';
import { GrAchievement } from 'react-icons/gr';
import Section from '@/shared/ui/sections/Section.jsx';
import Eyebrow from '@/shared/ui/Eyebrow.jsx';
import { HeroStatPill } from '@/shared/ui/hero.jsx';
import { localePath } from '@/i18n/routing.js';

const CONTENT = {
  ar: {
    eyebrow: 'لوحة الطالب',
    title: 'تابع كل خطوة في رحلتهم',
    intro: 'بعد التسجيل، هذه هي اللوحة التي تراها أنت والطالب — النقاط، المستوى، الترتيب، الأوسمة ولوحة الصدارة في مكان واحد.',
    cta: 'احجز حصة مجانية',
    badgeOnCard: 'معاينة اللوحة',
    card: {
      hi: 'مرحباً',
      name: 'آدم',
      myBoard: 'لوحتي',
      points: 'النقاط',
      level: 'المستوى',
      rank: 'الترتيب',
      subscription: '١٢ ساعة متبقية',
      badges: 'الأوسمة',
      badgeNames: ['نجمة الجزء ١', 'بطل المواظبة'],
      leaderboard: 'لوحة الصدارة',
      lbNames: ['آدم', 'سارة', 'يوسف'],
    },
  },
  en: {
    eyebrow: "Student's dashboard",
    title: 'See every step of their journey',
    intro: 'After signing up, this is the dashboard you and the student see — points, level, rank, badges and the leaderboard, all in one place.',
    cta: 'Book a free session',
    badgeOnCard: 'Dashboard preview',
    card: {
      hi: 'Hi',
      name: 'Adam',
      myBoard: 'My dashboard',
      points: 'Points',
      level: 'Level',
      rank: 'Rank',
      subscription: '12 hours remaining',
      badges: 'Badges',
      badgeNames: ['Juz 1 Star', 'Consistency Champ'],
      leaderboard: 'Leaderboard',
      lbNames: ['Adam', 'Sara', 'Yusuf'],
    },
  },
};

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function ChildDashboardHome({ lng = 'en' }) {
  const c = CONTENT[lng === 'en' ? 'en' : 'ar'];
  const card = c.card;

  return (
    <Section id="child-dashboard" alt>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        {/* ── Live-looking, honest dashboard preview ───────────────── */}
        <Box
          sx={{
            order: { xs: 2, md: 1 },
            position: 'relative',
            p: { xs: 1.25, md: 1.5 },
            borderRadius: 6,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 26px 60px rgba(26, 188, 156, 0.18)',
          }}
        >
          {/* faux app window bar */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.25, py: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(231, 76, 60, 0.72)' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(243, 156, 18, 0.82)' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(30, 111, 92, 0.82)' }} />
            <Chip
              label={c.badgeOnCard}
              size="small"
              sx={{ ml: 'auto', height: 22, fontSize: 11, fontWeight: 800, bgcolor: 'rgba(26, 188, 156, 0.1)', color: 'primary.main' }}
            />
          </Stack>

          <Box sx={{ p: { xs: 1.25, md: 1.75 } }}>
            {/* gradient hero — mirrors the real StudentOverview hero */}
            <Box
              sx={{
                borderRadius: 4,
                p: { xs: 2, md: 2.5 },
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(120deg, #1ABC9C 0%, #1E6F5C 100%)',
                boxShadow: '0 12px 28px rgba(26, 188, 156, 0.32)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  insetInlineEnd: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                <Avatar sx={{ width: 52, height: 52, bgcolor: 'secondary.main', fontSize: 26 }}>🦉</Avatar>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <Typography fontWeight={900} noWrap>
                    {card.hi}، {card.name} 🌟
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {card.myBoard}
                  </Typography>
                </Box>
                {/* stats wrap onto their own full-width row on phones */}
                <Stack
                  direction="row"
                  gap={1.5}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'space-around', sm: 'flex-start' },
                  }}
                >
                  <HeroStatPill filled={false} minWidth={56} value="640" label={card.points} />
                  <HeroStatPill filled={false} minWidth={56} value="3" label={card.level} />
                  <HeroStatPill filled={false} minWidth={56} value="#2" label={card.rank} />
                </Stack>
              </Stack>
            </Box>

            {/* active subscription chip (real feature) */}
            <Chip
              icon={<MdAccessTimeFilled />}
              color="success"
              variant="outlined"
              label={card.subscription}
              sx={{ mt: 2, fontWeight: 700 }}
            />

            {/* badges + mini leaderboard side by side */}
            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              <Box sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary">
                  {card.badges}
                </Typography>
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                  <Stack alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(246, 196, 83, 0.18)', color: 'secondary.main', width: 38, height: 38 }}>
                      <MdStar size={20} />
                    </Avatar>
                    <Typography variant="caption" align="center" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                      {card.badgeNames[0]}
                    </Typography>
                  </Stack>
                  <Stack alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                    <Avatar sx={{ bgcolor: 'rgba(26, 188, 156, 0.15)', color: 'primary.main', width: 38, height: 38 }}>
                      <GrAchievement size={18} />
                    </Avatar>
                    <Typography variant="caption" align="center" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                      {card.badgeNames[1]}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box component="span" sx={{ display: 'inline-flex', color: 'secondary.main' }}>
                    <MdEmojiEvents color="currentColor" size={16} />
                  </Box>
                  <Typography variant="caption" fontWeight={800} color="text.secondary">
                    {card.leaderboard}
                  </Typography>
                </Stack>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {card.lbNames.map((n, i) => (
                    <Stack key={n} direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: 11, fontWeight: 800, bgcolor: RANK_COLORS[i], color: '#3a2d00' }}>
                        {i + 1}
                      </Avatar>
                      <Typography variant="caption" fontWeight={i === 0 ? 900 : 600} noWrap sx={{ flex: 1 }}>
                        {n}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[640, 610, 580][i]}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Copy + CTA (no feature list — that lives in WhyAyah) ───── */}
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Typography variant="h2" sx={{ mb: 2 }}>
            {c.title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
            {c.intro}
          </Typography>
          <Button
            component="a"
            href={localePath(lng, '/register')}
            variant="contained"
            size="large"
            endIcon={
              <Box sx={{ display: 'flex', transform: lng === 'en' ? 'none' : 'scaleX(-1)' }}>
                <MdArrowForward />
              </Box>
            }
            sx={{ fontWeight: 800 }}
          >
            {c.cta}
          </Button>
        </Box>
      </Box>
    </Section>
  );
}

export default ChildDashboardHome;
