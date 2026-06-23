"use client";

import { useEffect, useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { USERS_URL } from "../config/constant.js";

/** Ban a user with an optional reason — POST users/:id/ban { reason? }. */
export default function BanDialog({ open, onClose, userId, txt, onSuccess }) {
  const [reason, setReason] = useState("");

  const banReq = useRequest({
    url: USERS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  function submit() {
    banReq.fetchData(`${userId}/ban`, { reason: reason.trim() || undefined });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.ban}
      maxWidth="sm"
      loading={banReq.isLoading}
      submitText={txt.ban}
      cancelText={txt.cancel}
      submitColor="error"
      onSubmit={submit}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {txt.banConfirm}
        </Typography>
        <TextField
          label={txt.banReasonLabel}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
      </Stack>
    </FormDialog>
  );
}
