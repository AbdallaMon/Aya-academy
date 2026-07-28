import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { getServicePageText, services, serviceText } from '../data.js';
import { localePath } from '@/i18n/routing.js';

export default function ServicesPage({ lng }) {
  const text = getServicePageText(lng);
  const language = lng === 'en' ? 'en' : 'ar';

  return (
    <MarketingSection eyebrow={text.indexEyebrow} title={text.indexTitle} titleComponent="h1" subtitle={text.indexDescription}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {services.map((service) => {
          const serviceCopy = serviceText(service, language);
          return (
            <Box key={service.slug} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>{serviceCopy.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>{serviceCopy.description}</Typography>
              <Link
                href={localePath(language, `/services/${service.slug}`)}
                style={{ alignSelf: 'flex-start', marginTop: 'auto', textDecoration: 'none' }}
              >
                <Button variant="outlined">{text.indexCta}</Button>
              </Link>
            </Box>
          );
        })}
      </Box>
    </MarketingSection>
  );
}
