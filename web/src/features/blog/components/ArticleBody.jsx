'use client';

// Block-based article renderer. Walks an article's `body` array and maps each
// typed block to a themed MUI element. No markdown/HTML — pure structured data,
// so it stays safe, on-brand, and correct in light/dark + RTL.

import { Box, Link as MuiLink, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  MdLightbulb,
  MdInfoOutline,
  MdWarningAmber,
  MdFormatQuote,
  MdHistoryEdu,
  MdVerified,
} from 'react-icons/md';
import { pick } from '../lib/helpers';

const CALLOUT_TONES = {
  tip: { color: 'success', Icon: MdLightbulb },
  info: { color: 'info', Icon: MdInfoOutline },
  warn: { color: 'warning', Icon: MdWarningAmber },
};

function Heading({ level, children }) {
  return (
    <Typography
      variant={level === 2 ? 'h4' : 'h5'}
      component={level === 2 ? 'h2' : 'h3'}
      sx={{ mt: level === 2 ? { xs: 4, md: 5 } : 3, mb: 1.5, fontWeight: 800 }}
    >
      {children}
    </Typography>
  );
}

function Paragraph({ children }) {
  return (
    <Typography
      variant="body1"
      sx={{ color: 'text.secondary', lineHeight: 2, fontSize: { xs: 16, md: 18 }, mb: 2 }}
    >
      {children}
    </Typography>
  );
}

function BulletList({ ordered, items, lng }) {
  return (
    <Box
      component={ordered ? 'ol' : 'ul'}
      sx={{
        my: 2,
        pl: 0,
        pr: 0,
        listStyle: 'none',
        counterReset: ordered ? 'list' : 'none',
      }}
    >
      {items.map((it, i) => (
        <Box
          key={i}
          component="li"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            mb: 1.25,
            ...(ordered && { counterIncrement: 'list' }),
          }}
        >
          <Box
            aria-hidden
            sx={{
              flexShrink: 0,
              mt: ordered ? 0 : '9px',
              ...(ordered
                ? {
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: 13,
                    fontWeight: 800,
                    '&::before': { content: 'counter(list)' },
                  }
                : {
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                  }),
            }}
          />
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', lineHeight: 1.9, fontSize: { xs: 16, md: 17 } }}
          >
            {pick(it, lng)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function Quote({ text, cite, lng }) {
  const theme = useTheme();
  return (
    <Box
      component="blockquote"
      sx={{
        position: 'relative',
        my: 3.5,
        mx: 0,
        p: { xs: 2.5, md: 3 },
        pt: 4,
        borderRadius: 4,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.18),
      }}
    >
      <Box
        aria-hidden
        sx={{ position: 'absolute', top: 10, insetInlineStart: 16, color: 'primary.main', opacity: 0.55 }}
      >
        <MdFormatQuote size={32} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, md: 20 }, lineHeight: 1.8 }}>
        {pick(text, lng)}
      </Typography>
      {cite && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          — {pick(cite, lng)}
        </Typography>
      )}
    </Box>
  );
}

function Callout({ tone = 'info', title, text, lng }) {
  const theme = useTheme();
  const cfg = CALLOUT_TONES[tone] || CALLOUT_TONES.info;
  const base = theme.palette[cfg.color].main;
  const { Icon } = cfg;
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        my: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 4,
        bgcolor: alpha(base, theme.palette.mode === 'dark' ? 0.14 : 0.08),
        border: '1px solid',
        borderColor: alpha(base, 0.3),
      }}
    >
      <Box sx={{ color: cfg.color + '.main', flexShrink: 0, mt: '2px' }}>
        <Icon size={24} />
      </Box>
      <Box>
        {title && (
          <Typography sx={{ fontWeight: 800, mb: 0.5, color: cfg.color + '.main' }}>
            {pick(title, lng)}
          </Typography>
        )}
        <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.primary' }}>
          {pick(text, lng)}
        </Typography>
      </Box>
    </Stack>
  );
}

function AyahCard({ arabic, surah, meaning, lng }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        my: 4,
        p: { xs: 3, md: 4 },
        borderRadius: 5,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.25),
        boxShadow: `0 18px 40px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.14)}`,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(60% 80% at 50% 0%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 70%)`,
        }}
      />
      <Box sx={{ position: 'relative' }}>
        <Typography
          sx={{
            direction: 'rtl',
            fontWeight: 700,
            fontSize: { xs: 22, md: 28 },
            lineHeight: 2.1,
            color: 'text.primary',
          }}
        >
          {arabic}
        </Typography>
        {surah && (
          <Typography sx={{ mt: 1, color: 'primary.main', fontWeight: 800, fontSize: 14 }}>
            {pick(surah, lng)}
          </Typography>
        )}
        {meaning && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8, maxWidth: 560, mx: 'auto' }}>
            {pick(meaning, lng)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Authenticated hadith card. Distinct from the ayah card (secondary accent +
// scroll icon) and — crucially — always carries its attribution: who narrated
// it (الراوي), the source book (المصدر), the grade (الدرجة), and a link to the
// الدرر السنية entry it was verified against. Nothing here is presented without
// a source.
function HadithCard({ arabic, narrator, source, grade, muhaddith, dorarUrl, explanation, lng }) {
  const theme = useTheme();
  const accent = theme.palette.secondary.main;
  const isAr = lng !== 'en';
  // صحيح → success, otherwise neutral/info tint.
  const sahih = grade && /صحيح|متفق/.test(grade.ar || '');
  const gradeColor = sahih ? theme.palette.success.main : theme.palette.info.main;
  const label = isAr ? 'حديث شريف' : 'Hadith';

  // "عن فلان — صحيح البخاري — صحيح" style attribution line.
  const attrParts = [
    narrator && `${isAr ? 'عن ' : ''}${pick(narrator, lng)}`,
    source && pick(source, lng),
  ].filter(Boolean);

  return (
    <Box
      sx={{
        my: 4,
        p: { xs: 2.75, md: 3.5 },
        borderRadius: 5,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        border: '1px solid',
        borderColor: alpha(accent, 0.28),
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          insetInlineStart: 14,
          top: 12,
          color: accent,
          opacity: 0.5,
        }}
      >
        <MdHistoryEdu size={30} />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          mb: 1.5,
          insetInlineStart: 'auto',
          color: accent,
          fontWeight: 800,
          fontSize: 13,
          justifyContent: 'flex-end',
        }}
      >
        <MdHistoryEdu size={16} />
        <Box component="span">{label}</Box>
      </Stack>

      <Typography
        sx={{
          direction: 'rtl',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: { xs: 19, md: 23 },
          lineHeight: 2.1,
          color: 'text.primary',
        }}
      >
        ‹ {arabic} ›
      </Typography>

      {/* Attribution + grade — always present for an authenticated hadith. */}
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        spacing={1}
        rowGap={0.75}
        sx={{ mt: 2 }}
      >
        {attrParts.length > 0 && (
          <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 13.5 }}>
            {attrParts.join(isAr ? ' — ' : ' · ')}
          </Typography>
        )}
        {grade && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.4}
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: alpha(gradeColor, 0.14),
              color: gradeColor,
              fontWeight: 800,
              fontSize: 12.5,
            }}
          >
            <MdVerified size={14} />
            <Box component="span">{pick(grade, lng)}</Box>
          </Stack>
        )}
      </Stack>

      {/* Source-of-record: الدرر السنية (linked when available). */}
      <Typography sx={{ mt: 1, textAlign: 'center', color: 'text.secondary', fontSize: 12, opacity: 0.85 }}>
        {isAr ? 'التخريج: ' : 'Grading: '}
        {muhaddith ? `${muhaddith} — ` : ''}
        {dorarUrl ? (
          <MuiLink
            href={dorarUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            sx={{ fontWeight: 700, color: 'secondary.main' }}
          >
            {isAr ? 'الدرر السنية' : 'Dorar.net'}
          </MuiLink>
        ) : (
          isAr ? 'الدرر السنية' : 'Dorar.net'
        )}
      </Typography>

      {explanation && (
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: alpha(accent, 0.18),
            color: 'text.secondary',
            lineHeight: 1.9,
            textAlign: 'center',
            maxWidth: 580,
            mx: 'auto',
          }}
        >
          {pick(explanation, lng)}
        </Typography>
      )}
    </Box>
  );
}

function Block({ block, lng }) {
  switch (block.type) {
    case 'h2':
      return <Heading level={2}>{pick(block.text, lng)}</Heading>;
    case 'h3':
      return <Heading level={3}>{pick(block.text, lng)}</Heading>;
    case 'p':
      return <Paragraph>{pick(block.text, lng)}</Paragraph>;
    case 'ul':
      return <BulletList items={block.items} lng={lng} />;
    case 'ol':
      return <BulletList ordered items={block.items} lng={lng} />;
    case 'quote':
      return <Quote text={block.text} cite={block.cite} lng={lng} />;
    case 'callout':
      return <Callout tone={block.tone} title={block.title} text={block.text} lng={lng} />;
    case 'ayah':
      return <AyahCard arabic={block.arabic} surah={block.surah} meaning={block.meaning} lng={lng} />;
    case 'hadith':
      return (
        <HadithCard
          arabic={block.arabic}
          narrator={block.narrator}
          source={block.source}
          grade={block.grade}
          muhaddith={block.muhaddith}
          dorarUrl={block.dorarUrl}
          explanation={block.explanation}
          lng={lng}
        />
      );
    default:
      return null;
  }
}

export default function ArticleBody({ body = [], lng }) {
  return (
    <Box>
      {body.map((block, i) => (
        <Block key={i} block={block} lng={lng} />
      ))}
    </Box>
  );
}
