import { Box, Button, Typography } from '@mui/material';
import { FaWhatsapp } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import MarketingSection from '@/shared/ui/sections/MarketingSection.jsx';
import { localePath } from '@/i18n/routing.js';
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_URL,
  getContactContent,
} from '../data.js';

export default function ContactSection({ lng }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getContactContent(language);

  return (
    <MarketingSection
      id="contact"
      alt
      eyebrow={content.eyebrow}
      title={content.title}
      subtitle={content.description}
      maxWidth="md"
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <Button
          component="a"
          href={localePath(language, '/contact')}
          variant="contained"
          size="large"
        >
          {language === 'en' ? 'View contact options' : 'اعرض وسائل التواصل'}
        </Button>
        <Button
          component="a"
          href={`mailto:${CONTACT_EMAIL}`}
          variant="outlined"
          size="large"
          startIcon={<MdEmail />}
        >
          {language === 'en' ? 'Email us' : 'راسلنا'}
        </Button>
        <Button
          component="a"
          href={`${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(content.whatsapp.message)}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="large"
          startIcon={<FaWhatsapp />}
        >
          {language === 'en' ? 'WhatsApp' : 'واتساب'}
        </Button>
      </Box>
      <Typography
        component="p"
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mt: 2.5 }}
      >
        {language === 'en'
          ? 'Please do not send passwords or payment-card details through contact channels.'
          : 'من فضلك لا ترسل كلمات المرور أو بيانات بطاقات الدفع عبر وسائل التواصل.'}
      </Typography>
    </MarketingSection>
  );
}
