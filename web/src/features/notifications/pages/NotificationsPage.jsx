"use client";

import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { LoadingOverlay, PageHeader } from "../../../shared/components/index.js";
import { useNotificationsText, localizedField } from "../config/notificationsText.js";

export default function NotificationsPage() {
  const txt = useNotificationsText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.NOTIFICATION.LIST);
  const canRead = hasPermission(PERMISSIONS.NOTIFICATION.READ);

  const listReq = useRequest({
    url: "notifications",
    method: "get",
    isPaginated: true,
    autoFetch: canList,
    syncToUrl: false,
    initialParams: { limit: 20 },
  });

  const markOneReq = useRequest({ url: "notifications", method: "patch" });
  const markAllReq = useRequest({
    url: "notifications/read-all",
    method: "patch",
    shouldAutoToast: true,
  });

  const items = listReq.data || [];
  const hasUnread = items.some((n) => !n.isRead);

  const markRead = async (id) => {
    await markOneReq.fetchData(`${id}/read`);
    listReq.triggerRefetch();
  };
  const markAll = async () => {
    await markAllReq.fetchData();
    listReq.triggerRefetch();
  };

  if (!canList) return null;

  return (
    <Box sx={{ position: "relative" }}>
      <PageHeader
        title={txt.title}
        description={txt.pageDescription}
        renderExtraComponent={() =>
          canRead && hasUnread ? (
            <Button variant="outlined" onClick={markAll} disabled={markAllReq.isLoading}>
              {txt.markAll}
            </Button>
          ) : null
        }
      />

      <Card elevation={2} sx={{ borderRadius: 3, position: "relative", minHeight: 200 }}>
        <LoadingOverlay isLoading={listReq.isLoading} />
        {items.length === 0 && !listReq.isLoading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {txt.empty}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((n, idx) => {
              const inner = (
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography fontWeight={n.isRead ? 500 : 800}>
                        {localizedField(n, "title", lng)}
                      </Typography>
                      {!n.isRead && <Chip size="small" color="primary" label={txt.unread} />}
                    </Stack>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {localizedField(n, "body", lng)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              );

              const itemSx = {
                alignItems: "flex-start",
                py: 1.5,
                bgcolor: n.isRead ? "transparent" : "action.hover",
              };

              const handleClick = () => {
                if (!n.isRead && canRead) markRead(n.id);
              };

              return (
                <Box key={n.id}>
                  {n.link ? (
                    <ListItemButton component={Link} href={n.link} onClick={handleClick} sx={itemSx}>
                      {inner}
                    </ListItemButton>
                  ) : canRead && !n.isRead ? (
                    <ListItemButton onClick={handleClick} sx={itemSx}>
                      {inner}
                    </ListItemButton>
                  ) : (
                    <ListItem sx={itemSx}>{inner}</ListItem>
                  )}
                  {idx < items.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        )}
      </Card>
    </Box>
  );
}
