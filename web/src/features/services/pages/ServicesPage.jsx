import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import {
  getServicePageText,
  programFamilies,
  programFamilyText,
  services,
  serviceText,
} from '../data.js';
import { localePath } from '@/i18n/routing.js';

export default function ServicesPage({ lng }) {
  const text = getServicePageText(lng);
  const language = lng === 'en' ? 'en' : 'ar';

  return (
    <MarketingSection eyebrow={text.indexEyebrow} title={text.indexTitle} titleComponent="h1" subtitle={text.indexDescription}>
      <Stack spacing={{ xs: 7, md: 10 }}>
        {programFamilies.map((family) => {
          const familyCopy = programFamilyText(family, language);
          const familyServices = services.filter((service) => family.serviceKeys.includes(service.key));

          return (
            <Box key={family.key} component="section" id={`${family.key}-programs`} sx={{ scrollMarginTop: 96 }}>
              <Box sx={{ maxWidth: 820, mb: 3 }}>
                <Typography component="h2" variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
                  {familyCopy.title}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.8 }}>
                  {familyCopy.description}
                </Typography>
              </Box>

              <Box
                component="ul"
                sx={{
                  m: 0,
                  mb: 4,
                  p: { xs: 2.5, md: 3 },
                  paddingInlineStart: { xs: '42px', md: '48px' },
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                  borderRadius: 4,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {familyCopy.topics.map((topic) => (
                  <Typography component="li" key={topic} color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {topic}
                  </Typography>
                ))}
              </Box>

              <Typography component="h3" variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                {text.familyPathsTitle}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: familyServices.length === 1 ? 'minmax(0, 560px)' : 'repeat(3, 1fr)' }, gap: 2.5 }}>
                {familyServices.map((service) => {
                  const serviceCopy = serviceText(service, language);
                  return (
                    <Box key={service.slug} component="article" sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
                      <Typography component="h4" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{serviceCopy.title}</Typography>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>{serviceCopy.description}</Typography>
                      <Link
                        href={localePath(language, `/services/${service.slug}`)}
                        style={{ alignSelf: 'flex-start', marginTop: 'auto', textDecoration: 'none' }}
                      >
                        <Button variant="outlined">
                          {text.indexCta}
                        </Button>
                      </Link>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </MarketingSection>
  );
}
