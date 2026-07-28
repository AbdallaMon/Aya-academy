"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { MdNotifications } from "react-icons/md";
import { usePermission } from "../../../hooks/usePermission.js";
import { useTranslation } from "../../../i18n/client.js";
import { PERMISSIONS } from "@ayah/shared";
import { useNotifications } from "../hooks/useNotifications.js";
import { useNotificationsText, localizedField } from "../config/notificationsText.js";

export default function NotificationBell() {
  const { hasPermission } = usePermission();
  const { lng } = useTranslation();
  const txt = useNotificationsText();
  const canList = hasPermission(PERMISSIONS.NOTIFICATION.LIST);
  const canRead = hasPermission(PERMISSIONS.NOTIFICATION.READ);

  const [anchorEl, setAnchorEl] = useState(null);
  const { unreadCount, items, isLoading, markRead, markAll, isMarkingAll } =
    useNotifications({ canList });

  if (!canList) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={txt.title}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <MdNotifications size={22} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 360, maxWidth: "90vw", borderRadius: 2 } } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {txt.title}
          </Typography>
          {canRead && unreadCount > 0 && (
            <Button size="small" onClick={markAll} disabled={isMarkingAll}>
              {txt.markAll}
            </Button>
          )}
        </Stack>
        <Divider />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {txt.empty}
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
            {items.map((n) => {
              const inner = (
                <Stack spacing={0.25} sx={{ width: "100%" }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    {!n.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={n.isRead ? 400 : 700}
                      noWrap
                    >
                      {localizedField(n, "title", lng)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {localizedField(n, "body", lng)}
                  </Typography>
                </Stack>
              );

              const handleClick = () => {
                if (!n.isRead && canRead) markRead(n.id);
              };

              return n.link ? (
                <ListItemButton
                  key={n.id}
                  component={Link}
                  href={n.link}
                  onClick={handleClick}
                  sx={{ alignItems: "flex-start", py: 1.25 }}
                >
                  {inner}
                </ListItemButton>
              ) : (
                <ListItemButton
                  key={n.id}
                  onClick={handleClick}
                  sx={{ alignItems: "flex-start", py: 1.25 }}
                >
                  {inner}
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider />
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Button
            component={Link}
            href="/dashboard/notifications"
            size="small"
            fullWidth
            onClick={() => setAnchorEl(null)}
          >
            {txt.viewAll}
          </Button>
        </Box>
      </Popover>
    </>
  );
}
