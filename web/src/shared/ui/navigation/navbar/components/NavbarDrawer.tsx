'use client';
import { navActions, navLinks } from '@/shared/data/navigation/navbar';
import { ThemeSwitch } from '@/shared/ui/buttons/ThemeSwitch';
import { Box, Button, Drawer, IconButton, List, ListItem } from '@mui/material';
import { useState } from 'react';
import { IoMdClose, IoMdMenu } from 'react-icons/io';

export default function NavbarDrawer() {
  const [open, setOpen] = useState(false);
  function toggleDrawer(): void {
    setOpen(!open);
  }
  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'flex-end',
        flex: 1,
      }}
    >
      <ThemeSwitch />

      <IconButton onClick={toggleDrawer} size="medium">
        <IoMdMenu />
      </IconButton>
      <Drawer open={open} onClose={toggleDrawer} anchor="left">
        <Box sx={{ width: 300, padding: 2 }}>
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
              mb: 2,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box
              component={'img'}
              src="/logos/logo.png"
              alt="Logo"
              sx={{ height: 60 }}
            />
            <Box>
              <IconButton
                onClick={toggleDrawer}
                size="medium"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                color="primary"
              >
                <IoMdClose size={18} />
              </IconButton>
            </Box>
          </Box>
          <List>
            {navLinks.map((link) => (
              <ListItem
                key={link.text}
                component={Button}
                variant="text"
                href={link.href}
                onClick={toggleDrawer}
              >
                {link.text}
              </ListItem>
            ))}
          </List>
          <Box mt={2}>
            {navActions.map((action) => {
              return (
                <Button
                  key={action.text}
                  component="a"
                  href={action.href}
                  variant={action.type === 'button' ? 'contained' : 'outlined'}
                  sx={{
                    marginRight: 2,
                    display: 'block',
                    marginBottom: 2,
                    textAlign: 'center',
                  }}
                >
                  {action.text}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
