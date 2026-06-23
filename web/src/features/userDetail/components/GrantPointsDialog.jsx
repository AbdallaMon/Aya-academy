"use client";

import { useEffect, useState } from "react";
import { Stack, TextField } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { POINTS_URL } from "../config/constant.js";

/** Admin: manually grant points — POST points { studentId, amount, reason? }. */
export default function GrantPointsDialog({ open, onClose, studentId, txt, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const grantReq = useRequest({
    url: POINTS_URL,
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
      setAmount("");
      setReason("");
    }
  }, [open]);

  function submit() {
    const value = Number(amount);
    if (!studentId || !Number.isInteger(value) || value === 0) return;
    grantReq.fetchData(null, {
      studentId: Number(studentId),
      amount: value,
      reason: reason.trim() || undefined,
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.grantPoints}
      maxWidth="sm"
      loading={grantReq.isLoading}
      submitText={txt.grant}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <TextField
          type="number"
          label={txt.pointsAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label={txt.pointsReason}
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
