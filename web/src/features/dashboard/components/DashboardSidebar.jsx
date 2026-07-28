"use client";

import { Avatar, Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { MdLogout, MdClose } from "react-icons/md";
import DashboardNav from "./DashboardNav.jsx";
import { roleLabelKey } from "../config/navModel.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";

/**
 * DashboardSidebar — the full-height sidebar column shared by the desktop
 * permanent nav and the mobile drawer: brand header, scrollable nav and the
 * pinned user footer. Pure presentational extraction from DashboardShell.
 */
export default function DashboardSidebar({
  role,
  isDesktop,
  displayName,
  initial,
  avatar,
  txt,
  onClose,
  onNavigate,
  logout,
}) {
  const theme = useTheme();
  return (
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
            onClick={onClose}
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
        <DashboardNav role={role} onNavigate={onNavigate} />
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
            src={buildFileUrl(avatar) || undefined}
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
}
