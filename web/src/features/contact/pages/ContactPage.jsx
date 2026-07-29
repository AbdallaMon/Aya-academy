import { Box, Button, Container, Typography } from '@mui/material';
import { FaWhatsapp } from 'react-icons/fa';
import { MdEmail, MdOutlineShield } from 'react-icons/md';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { localePath } from '@/i18n/routing.js';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_URL,
  getContactContent,
} from '../data.js';

const METHOD_ICONS = [MdEmail, FaWhatsapp];

export default function ContactPage({ lng }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getContactContent(language);
  const methods = [
    {
      ...content.email,
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(content.email.subject)}`,
      detail: CONTACT_EMAIL,
    },
    {
      ...content.whatsapp,
      href: `${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(content.whatsapp.message)}`,
      detail: CONTACT_PHONE_DISPLAY,
      external: true,
    },
  ];

  return (
    <>
      <Box
        component="header"
        sx={{
          py: { xs: 7, md: 11 },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            component="p"
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontSize: 13,
              mb: 1.5,
            }}
          >
            {content.eyebrow}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            {content.title}
          </Typography>
          <Typography
            component="p"
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              lineHeight: 1.9,
              maxWidth: 760,
              mx: 'auto',
            }}
          >
            {content.description}
          </Typography>
        </Container>
      </Box>

      <MarketingSection title={content.methodsTitle} maxWidth="md">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2.5,
          }}
        >
          {methods.map((method, index) => {
            const Icon = METHOD_ICONS[index];
            return (
              <Box
                key={method.title}
                component="article"
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 3,
                    color: index === 1 ? '#16833f' : 'primary.main',
                    bgcolor: index === 1 ? 'rgba(37, 211, 102, 0.1)' : 'rgba(12, 124, 111, 0.08)',
                    mb: 2.5,
                  }}
                >
                  <Icon size={29} aria-hidden />
                </Box>
                <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  {method.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 1 }}>
                  {method.body}
                </Typography>
                <Typography
                  component="p"
                  dir="ltr"
                  sx={{ color: 'text.primary', fontWeight: 700, mb: 3 }}
                >
                  {method.detail}
                </Typography>
                <Button
                  component="a"
                  href={method.href}
                  target={method.external ? '_blank' : undefined}
                  rel={method.external ? 'noopener noreferrer' : undefined}
                  variant={index === 0 ? 'outlined' : 'contained'}
                  sx={{ mt: 'auto' }}
                >
                  {method.action}
                </Button>
              </Box>
            );
          })}
        </Box>
      </MarketingSection>

      <MarketingSection
        alt
        title={content.prepareTitle}
        subtitle={content.prepareIntro}
        maxWidth="md"
      >
        <Box
          component="ul"
          sx={{
            m: 0,
            mx: 'auto',
            p: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 1.5,
            maxWidth: 720,
          }}
        >
          {content.prepareItems.map((item) => (
            <Box
              key={item}
              component="li"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 9,
                  height: 9,
                  mt: 0.9,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ lineHeight: 1.75 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 1.25,
            alignItems: 'flex-start',
            maxWidth: 720,
            mx: 'auto',
            mt: 2.5,
            p: 2,
            borderRadius: 3,
            color: 'text.secondary',
            bgcolor: 'rgba(246, 196, 83, 0.12)',
          }}
        >
          <MdOutlineShield size={23} aria-hidden style={{ flexShrink: 0 }} />
          <Typography variant="body2" sx={{ lineHeight: 1.75 }}>
            {content.safetyNote}{' '}
            <Box
              component="a"
              href={localePath(language, '/privacy')}
              sx={{ color: 'primary.main', fontWeight: 800 }}
            >
              {content.privacyAction}
            </Box>
          </Typography>
        </Box>
      </MarketingSection>

      <MarketingSection maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            p: { xs: 3, md: 5 },
            borderRadius: 5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography component="h2" variant="h3" sx={{ mb: 1.5 }}>
            {content.trialTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 650, mx: 'auto' }}>
            {content.trialBody}
          </Typography>
          <Button
            component="a"
            href={localePath(language, '/register')}
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            {content.trialAction}
          </Button>
        </Box>
      </MarketingSection>
    </>
  );
}
