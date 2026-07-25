"use client";

import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { MdMenu, MdLogout } from "react-icons/md";
import { LanguageSwitch } from "../../../shared/ui/buttons/LanguageSwitch.jsx";
import NotificationBell from "../../notifications/components/NotificationBell.jsx";
import { roleLabelKey } from "../config/navModel.js";

/**
 * DashboardTopbar — the sticky top AppBar: mobile menu button, route-driven
 * section title, language switch, notification bell and the user menu.
 * Pure presentational extraction from DashboardShell (the user-menu anchor
 * state is local to the bar).
 */
export default function DashboardTopbar({
  isDesktop,
  txt,
  role,
  pageTitle,
  displayName,
  initial,
  lng,
  logout,
  onOpenMobile,
}) {
  const theme = useTheme();
  const [userMenu, setUserMenu] = useState(null);

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 64, md: 72 } }}>
        {!isDesktop && (
          <IconButton
            edge="start"
            onClick={onOpenMobile}
            aria-label={txt.menu}
            sx={{ marginInlineEnd: 0.5 }}
          >
            <MdMenu />
          </IconButton>
        )}

        {/* Current section title (route-driven) */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            noWrap
            sx={{ color: "text.primary", lineHeight: 1.2, letterSpacing: "-0.01em" }}
          >
            {pageTitle}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" alignItems="center" gap={0.5}>
          <LanguageSwitch />

          <NotificationBell />

          <Tooltip title={displayName}>
            <IconButton onClick={(e) => setUserMenu(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar
                sx={{ bgcolor: "primary.main", width: 38, height: 38, fontWeight: 800 }}
              >
                {initial}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>

        <Menu
          anchorEl={userMenu}
          open={Boolean(userMenu)}
          onClose={() => setUserMenu(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: lng === "ar" ? "left" : "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: lng === "ar" ? "left" : "right",
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {txt[roleLabelKey(role)]}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setUserMenu(null);
              logout();
            }}
          >
            <ListItemIcon>
              <MdLogout />
            </ListItemIcon>
            {txt.logout}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
