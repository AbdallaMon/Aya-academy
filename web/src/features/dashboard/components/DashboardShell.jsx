"use client";

// Dashboard shell: auth gate + responsive sidebar/topbar around the page content.
//
// - Gates rendering on auth (validatingAuth / isLoggedIn). The AuthProvider
//   already redirects to /login on a hard 401 for protected routes; here we add
//   a friendly loading state and a guard for the not-logged-in case.
// - Sidebar links are role + permission gated (DashboardNav, inside
//   DashboardSidebar).
// - The sidebar (desktop) and drawer (mobile) both span the full viewport height.
// - Topbar (DashboardTopbar) carries language, notifications + the user menu.

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  CircularProgress,
  Drawer,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useAuth } from "../../../hooks/useAuth.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath, stripLocale } from "../../../i18n/routing.js";
import DashboardSidebar from "./DashboardSidebar.jsx";
import DashboardTopbar from "./DashboardTopbar.jsx";
import { useDashboardText } from "../config/dashboardText.js";
import { findNavItemByPath } from "../config/navModel.js";

const SIDEBAR_WIDTH = 280;
const CONTENT_MAX_WIDTH = 1440;

export default function DashboardShell({ children }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const txt = useDashboardText();
  const { lng } = useTranslation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const displayName =
    user.nickname || user.name || user.username || user.email;
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
    <DashboardSidebar
      role={role}
      isDesktop={isDesktop}
      displayName={displayName}
      initial={initial}
      avatar={user.avatar}
      txt={txt}
      onClose={() => setMobileOpen(false)}
      onNavigate={() => setMobileOpen(false)}
      logout={logout}
    />
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
        <DashboardTopbar
          isDesktop={isDesktop}
          txt={txt}
          role={role}
          pageTitle={pageTitle}
          displayName={displayName}
          initial={initial}
          avatar={user.avatar}
          lng={lng}
          logout={logout}
          onOpenMobile={() => setMobileOpen(true)}
        />

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
