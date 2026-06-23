"use client";

import { useEffect } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { MdVisibility } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { USERS_URL } from "../config/constant.js";

/**
 * Read-only: list the children (linked students) of a PARENT.
 * GET users/:id/children → [{ id, name, nickname, relation }]
 * Admin may view any parent; a parent may only view their own (server-enforced).
 */
export default function ChildrenDialog({ open, onClose, parent, txt }) {
  const { lng } = useTranslation();
  const childrenReq = useRequest({
    url: parent?.id ? `${USERS_URL}/${parent.id}/children` : null,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    if (open && parent?.id) childrenReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parent?.id]);

  const relationLabels = {
    FATHER: txt.father,
    MOTHER: txt.mother,
    GUARDIAN: txt.guardian,
    OTHER: txt.other,
  };

  const children = childrenReq.data || [];
  const loading = childrenReq.isLoading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack>
          <Typography component="span" fontWeight={800}>
            {txt.childrenTitle}
          </Typography>
          {parent?.name && (
            <Typography component="span" variant="body2" color="text.secondary">
              {parent.name}
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : children.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {txt.noChildren}
          </Typography>
        ) : (
          <List disablePadding>
            {children.map((child) => (
              <ListItem
                key={child.id}
                disableGutters
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack>
                  <Typography fontWeight={700}>{child.name}</Typography>
                  {child.nickname && (
                    <Typography variant="caption" color="text.secondary">
                      {child.nickname}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    color="info"
                    label={relationLabels[child.relation] || child.relation}
                  />
                  <Button
                    size="small"
                    color="info"
                    startIcon={<MdVisibility />}
                    component={Link}
                    href={localePath(lng, `/dashboard/users/${child.id}`)}
                  >
                    {txt.childDetails}
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{txt.close}</Button>
      </DialogActions>
    </Dialog>
  );
}
