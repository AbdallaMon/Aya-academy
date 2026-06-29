'use client';

// Mirrored login glyph — the MdLogin icon carries a directional arrow, so it is
// flipped in Arabic (same pattern as the nav arrows). Shared by the desktop
// login button and the mobile bar/drawer so the two never drift.

import { Box } from '@mui/material';
import { MdLogin } from 'react-icons/md';

export default function LoginIcon({ lng, size }) {
  return (
    <Box sx={{ display: 'flex', transform: lng === 'en' ? 'none' : 'scaleX(-1)' }}>
      <MdLogin size={size} />
    </Box>
  );
}
