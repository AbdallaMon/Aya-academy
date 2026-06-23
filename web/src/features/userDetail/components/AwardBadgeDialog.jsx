"use client";

import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { BADGES_URL } from "../config/constant.js";

/**
 * Admin: pick a badge definition from `GET badges` then
 * `POST badges/:badgeId/award { studentId }`.
 */
export default function AwardBadgeDialog({ open, onClose, studentId, txt, onSuccess }) {
  const { lng } = useTranslation();
  const [badgeId, setBadgeId] = useState("");

  const badgesReq = useRequest({
    url: BADGES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, isActive: true },
  });

  // award POSTs to badges/:id/award — slug carries the badge id.
  const awardReq = useRequest({
    url: BADGES_URL,
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
    if (open) {
      setBadgeId("");
      badgesReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const badges = badgesReq.data || [];

  function submit() {
    if (!badgeId || !studentId) return;
    awardReq.fetchData(`${badgeId}/award`, { studentId: Number(studentId) });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.awardBadge}
      maxWidth="sm"
      loading={awardReq.isLoading}
      submitText={txt.award}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {txt.awardSuccessHint}
        </Typography>
        <TextField
          select
          label={txt.selectBadge}
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
          fullWidth
          required
        >
          {badges.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.emoji ? `${b.emoji} ` : ""}
              {lng === "en" ? b.nameEn || b.nameAr : b.nameAr || b.nameEn}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FormDialog>
  );
}
