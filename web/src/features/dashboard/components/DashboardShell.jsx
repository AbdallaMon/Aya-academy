"use client";

// Dashboard shell: auth gate + responsive sidebar/topbar around the page content.
//
// - Gates rendering on auth (validatingAuth / isLoggedIn). The AuthProvider
//   already redirects to /login on a hard 401 for protected routes; here we add
//   a friendly loading state and a guard for the not-logged-in case.
// - Sidebar links are role + permission gated (DashboardNav).
// - The sidebar (desktop) and drawer (mobile) both span the full viewport height.
// - Topbar carries the theme toggle, notification bell + user menu.

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { MdMenu, MdLogout, MdLightMode, MdDarkMode, MdClose } from "react-icons/md";
import { useAuth } from "../../../hooks/useAuth.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath, stripLocale } from "../../../i18n/routing.js";
import { useThemeToggler } from "../../../providers/ThemeToggler.jsx";
import { LanguageSwitch } from "../../../shared/ui/buttons/LanguageSwitch.jsx";
import NotificationBell from "../../notifications/components/NotificationBell.jsx";
import DashboardNav from "./DashboardNav.jsx";
import { useDashboardText } from "../config/dashboardText.js";
import { roleLabelKey, findNavItemByPath } from "../config/navModel.js";

const SIDEBAR_WIDTH = 280;
const CONTENT_MAX_WIDTH = 1440;

export default function DashboardShell({ children }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const txt = useDashboardText();
  const { lng } = useTranslation();
  const { theme: mode, toggleTheme } = useThemeToggler();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(null);
  const { user, isLoggedIn, validatingAuth, logout } = useAuth();

  // If validation finished and there is no session, send to login. (Belt &
  // suspenders alongside AuthProvider's 401 handler.)
  useEffect(() => {
    if (!validatingAuth && !isLoggedIn) router.replace(localePath(lng, "/login"));
  }, [validatingAuth, isLoggedIn, router, lng]);

  if (validatingAuth || !isLoggedIn || !user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {txt.loading}
        </Typography>
      </Box>
    );
  }

  const role = user.role;
  const displayName = user.nickname || user.name || user.email;
  const initial = String(displayName).charAt(0).toUpperCase();

  // Derive the current section title from the nav model (route-driven).
  const barePath = stripLocale(pathname);
  const currentNav = findNavItemByPath(role, barePath);
  // Detail routes that aren't nav items get an explicit title.
  const isUserDetail = /^\/dashboard\/users\/[^/]+$/.test(barePath);
  const pageTitle = isUserDetail
    ? txt.userDetails
    : currentNav
      ? txt[currentNav.labelKey] ?? txt.overview
      : txt.overview;

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand header */}
      <Box
        sx={{
          px: 2.5,
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.18
          )}, ${alpha(theme.palette.secondary.main, 0.12)})`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 46,
            height: 46,
            borderRadius: 3,
            bgcolor: "background.paper",
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src="/logos/logo.png"
            alt={txt.appName}
            sx={{ height: 34, width: "auto" }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={900}
            noWrap
            sx={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            {txt.appName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {txt[roleLabelKey(role)]}
          </Typography>
        </Box>
        {!isDesktop && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{ marginInlineStart: "auto" }}
            aria-label={txt.close ?? "close"}
          >
            <MdClose />
          </IconButton>
        )}
      </Box>

      {/* Nav (independent scroll) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          py: 2,
          // Slim, on-brand scrollbar.
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(theme.palette.primary.main, 0.25),
            borderRadius: 8,
          },
        }}
      >
        <DashboardNav role={role} onNavigate={() => setMobileOpen(false)} />
      </Box>

      {/* User footer — pinned to bottom */}
      <Box sx={{ p: 2, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          sx={{
            mb: 1.5,
            p: 1.25,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.07),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 42,
              height: 42,
              fontWeight: 800,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {txt[roleLabelKey(role)]}
            </Typography>
          </Box>
        </Stack>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<MdLogout />}
          onClick={logout}
          sx={{ borderRadius: 2.5, py: 0.9 }}
        >
          {txt.logout}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Desktop permanent sidebar — true full-viewport-height column with its
          own internal scroll. The main column scrolls independently. */}
      {isDesktop ? (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            borderInlineEnd: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          {sidebarContent}
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          anchor={lng === "ar" ? "right" : "left"}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              height: "100vh",
              boxSizing: "border-box",
              borderImage: "none",
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main column — owns its own vertical scroll */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
                onClick={() => setMobileOpen(true)}
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

              <Tooltip title={mode === "dark" ? "Light" : "Dark"}>
                <IconButton onClick={toggleTheme} color="inherit">
                  {mode === "dark" ? <MdLightMode /> : <MdDarkMode />}
                </IconButton>
              </Tooltip>

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

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            // Slim scrollbar on the content region.
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.25),
              borderRadius: 8,
            },
          }}
        >
          <Box
            sx={{
              maxWidth: CONTENT_MAX_WIDTH,
              mx: "auto",
              width: "100%",
              p: { xs: 2, sm: 2.5, md: 3.5 },
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
