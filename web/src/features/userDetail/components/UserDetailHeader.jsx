"use client";

import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import {
  MdArrowBack,
  MdMoreVert,
  MdAssessment,
  MdMarkEmailRead,
  MdBlock,
  MdCheckCircle,
  MdEmail,
  MdAlternateEmail,
  MdPhone,
} from "react-icons/md";
import { USER_ROLES } from "@aya/shared";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { buildFileUrl } from "../../../shared/lib/fileUrl.js";
import { formatDate } from "../config/constant.js";

const ROLE_COLOR = { ADMIN: "secondary", PARENT: "info", STUDENT: "primary" };

/**
 * Role-adaptive header for the user-detail surface: avatar, name, role chip,
 * contact (email + phone), ban/active status, and an actions menu.
 */
export default function UserDetailHeader({
  user,
  txt,
  actions = {},
  can = {},
}) {
  const { lng } = useTranslation();
  const [menuEl, setMenuEl] = useState(null);
  const closeMenu = () => setMenuEl(null);

  if (!user) return null;

  const isBanned = Boolean(user.bannedAt);
  const isAdminTarget = user.role === USER_ROLES.ADMIN;
  const roleLabel =
    user.role === USER_ROLES.ADMIN
      ? txt.roleAdmin
      : user.role === USER_ROLES.PARENT
        ? txt.roleParent
        : txt.roleStudent;
  const displayName = user.name || user.username || user.email;
  const initial = String(user.nickname || displayName || "?").charAt(0).toUpperCase();
  const avatarUrl = buildFileUrl(user.avatar);

  // Ban/unban is hidden entirely for ADMIN targets (backend blocks it too).
  const showBanMenu = can.ban && !isAdminTarget;
  const hasMenu = can.sendReport || can.sendInvite || showBanMenu;

  return (
    <Box sx={{ mb: 3 }}>
      <Button
        component={Link}
        href={localePath(lng, "/dashboard/users")}
        startIcon={<MdArrowBack />}
        size="small"
        sx={{ mb: 2 }}
      >
        {txt.back}
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={avatarUrl || undefined}
            sx={{ bgcolor: "primary.main", width: 64, height: 64, fontWeight: 800, fontSize: 28 }}
          >
            {initial}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4" fontWeight={800}>
                {displayName}
              </Typography>
              <Chip size="small" color={ROLE_COLOR[user.role] || "default"} label={roleLabel} />
              {isBanned ? (
                <Chip size="small" color="error" label={txt.bannedChip} />
              ) : (
                <Chip
                  size="small"
                  color={user.isActive ? "success" : "default"}
                  variant={user.isActive ? "filled" : "outlined"}
                  label={user.isActive ? txt.activeChip : txt.inactiveChip}
                />
              )}
            </Stack>
            {user.nickname && user.nickname !== displayName && (
              <Typography variant="body2" color="text.secondary">
                {user.nickname}
              </Typography>
            )}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {user.username && (
                <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                  <MdAlternateEmail size={16} />
                  <Typography variant="body2">@{user.username}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <MdEmail size={16} />
                <Typography variant="body2">{user.email || txt.noEmail}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <MdPhone size={16} />
                <Typography variant="body2">{user.phone || txt.noPhone}</Typography>
              </Stack>
              {user.createdAt && (
                <Typography variant="body2" color="text.secondary">
                  {txt.joinedOn}: {formatDate(user.createdAt, lng)}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        {hasMenu && (
          <Box>
            <IconButton onClick={(e) => setMenuEl(e.currentTarget)} aria-label={txt.actions}>
              <MdMoreVert />
            </IconButton>
            <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={closeMenu}>
              {can.sendReport && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    actions.onSendReport?.();
                  }}
                >
                  <MdAssessment style={{ marginInlineEnd: 8 }} />
                  {txt.sendReport}
                </MenuItem>
              )}
              {can.sendInvite && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    actions.onSendInvite?.();
                  }}
                >
                  <MdMarkEmailRead style={{ marginInlineEnd: 8 }} />
                  {txt.sendInvite}
                </MenuItem>
              )}
              {showBanMenu &&
                (isBanned ? (
                  <MenuItem
                    onClick={() => {
                      closeMenu();
                      actions.onUnban?.();
                    }}
                  >
                    <MdCheckCircle style={{ marginInlineEnd: 8 }} />
                    {txt.unban}
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => {
                      closeMenu();
                      actions.onBan?.();
                    }}
                    sx={{ color: "error.main" }}
                  >
                    <MdBlock style={{ marginInlineEnd: 8 }} />
                    {txt.ban}
                  </MenuItem>
                ))}
            </Menu>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
