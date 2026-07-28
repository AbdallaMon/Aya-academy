import { Box } from '@mui/material';
import SiteNavbar from '@/shared/ui/navigation/navbar';
import SiteFooter from '@/shared/ui/navigation/footer';

// Marketing shell: the public-facing site chrome (top navbar + footer). The
// dashboard lives in a separate route group and intentionally does NOT use this
// layout, so the marketing navbar never appears inside /dashboard.
export default function MarketingLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteNavbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
