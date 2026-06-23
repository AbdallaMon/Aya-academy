import { navActions, navLinks } from '@/shared/data/navigation/navbar';
import {
  AppBar,
  Box,
  Button,
  Container,
  Link,
  Stack,
  Toolbar,
} from '@mui/material';
import NavbarDrawer from './components/NavbarDrawer';
import { ThemeSwitch } from '../../buttons/ThemeSwitch';

export default function Navbar() {
  return (
    <AppBar
      position="static"
      sx={{
        '& .MuiPaper-root': {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{}}>
          <Box
            sx={{
              width: '100%',
              alignItems: 'center',
              display: 'flex',
              gap: 2,
            }}
          >
            <Box
              component={'img'}
              src="/logos/logo.png"
              alt="Logo"
              sx={{ height: 70 }}
            />
            <Box
              sx={{
                flex: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                gap: 2.5,
              }}
            >
              {navLinks.map((link) => (
                <Box
                  component={Link}
                  key={link.text}
                  href={link.href}
                  sx={{
                    color: 'text.primary',
                  }}
                >
                  {link.text}
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                width: ' fit-content',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <Stack direction="row" spacing={2}>
                {navActions.map((action) => {
                  return (
                    <Button
                      component="a"
                      key={action.text}
                      href={action.href}
                      variant={action.type === 'link' ? 'text' : 'contained'}
                    >
                      {action.text}
                    </Button>
                  );
                })}
                <ThemeSwitch />
              </Stack>
            </Box>
            <NavbarDrawer />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
