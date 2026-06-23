import { Box, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { IoIosCheckmark } from 'react-icons/io';

export function HomeFeature({ feature }: { feature: string }) {
  return (
    <ListItem
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <ListItemIcon
        sx={{
          color: 'primary.main',
          width: 28,
          minWidth: 28,
          height: 28,
          borderRadius: '50%',
          border: '2px solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          //   borderColor: 'primary.main',
        }}
      >
        <IoIosCheckmark size={24} />
      </ListItemIcon>
      <ListItemText primary={feature}></ListItemText>
    </ListItem>
  );
}
