"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { FiRefreshCw } from "react-icons/fi";
import { DRIVE_ACCOUNT_TYPES, backupMessagesCodes } from "@ayah/shared";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useBackupsText } from "../hooks/useBackupsText.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import {
  BACKUPS_RESTORE_URL,
  DRIVE_CONNECT_URL,
  buildDriveConnectSlug,
} from "../config/constant.js";

/**
 * RestoreDialog — restore the database from a specific backup (destructive).
 *   POST /backups/actions/restore { backupId, confirm: true }
 *
 * Preflight: the backend may reply 409 with code ACCOUNTS_RECONNECT_REQUIRED and
 * details.accountsToReconnect = [{ id, email, type }]. We read it from the
 * caught error (ApiFetch puts the envelope on e.data) and show the accounts to
 * reconnect + a retry button.
 *
 * props: open, backup (the row), onClose, onDone
 */
export default function RestoreDialog({ open, backup, onClose, onDone }) {
  const { tr } = useBackupsText();
  const [acknowledged, setAcknowledged] = useState(false);
  // Accounts that need reconnecting (from preflight) — null means none.
  const [reconnectList, setReconnectList] = useState(null);

  const { fetchData, isLoading } = useRequest({
    url: BACKUPS_RESTORE_URL,
    method: "post",
    shouldAutoToast: true,
    onSuccess: () => {
      reset();
      onDone?.();
      onClose?.();
    },
  });

  const connect = useRequest({
    url: DRIVE_CONNECT_URL,
    method: "get",
    syncToUrl: false,
    onSuccess: (res) => {
      const url = res?.data?.authUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    },
  });

  function reset() {
    setAcknowledged(false);
    setReconnectList(null);
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  function submit() {
    if (!backup || !acknowledged) return;
    setReconnectList(null);
    fetchData(null, { backupId: backup.id, confirm: true }).catch((e) => {
      // Read preflight details: ApiFetch puts the envelope on e.data.
      const code = e?.data?.message || e?.data?.translationKey;
      const list = e?.data?.details?.accountsToReconnect;
      if (
        (code === backupMessagesCodes.ACCOUNTS_RECONNECT_REQUIRED ||
          Array.isArray(list)) &&
        Array.isArray(list) &&
        list.length > 0
      ) {
        setReconnectList(list);
      }
    });
  }

  function reconnect(account) {
    connect
      .fetchData(
        buildDriveConnectSlug({
          type: account.type || DRIVE_ACCOUNT_TYPES.DB,
          reconnectId: account.id,
        }),
      )
      .catch(() => {});
  }

  const showReconnect = Array.isArray(reconnectList) && reconnectList.length > 0;

  return (
    <ConfirmDialog
      open={open}
      intent="danger"
      maxWidth="sm"
      title={tr.restoreTitle}
      loading={isLoading}
      onCancel={handleClose}
      onConfirm={submit}
      renderActions={() => (
        <Button
          variant="contained"
          color="error"
          onClick={submit}
          disabled={isLoading || !acknowledged}
          startIcon={
            isLoading ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {showReconnect ? tr.retryRestore : tr.restoreConfirm}
        </Button>
      )}
    >
      <Stack spacing={2}>
        <Alert severity="error" variant="outlined">
          {tr.restoreWarning}
        </Alert>
        {backup?.fileName && (
          <Typography variant="body2" color="text.secondary">
            {tr.fileName}: <strong>{backup.fileName}</strong>
          </Typography>
        )}

        {showReconnect && (
          <Box>
            <Alert severity="warning" variant="outlined" sx={{ mb: 1 }}>
              {tr.reconnectBody}
            </Alert>
            <Stack spacing={1}>
              {reconnectList.map((acc) => (
                <Stack
                  key={acc.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {acc.email || `#${acc.id}`}
                    </Typography>
                    <Chip
                      size="small"
                      color={acc.type === DRIVE_ACCOUNT_TYPES.KEY ? "secondary" : "info"}
                      label={
                        acc.type === DRIVE_ACCOUNT_TYPES.KEY ? tr.typeKey : tr.typeDb
                      }
                    />
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FiRefreshCw />}
                    disabled={connect.isLoading}
                    onClick={() => reconnect(acc)}
                  >
                    {tr.reconnectAccount}
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              color="error"
            />
          }
          label={tr.restoreConfirmCheckbox}
        />
      </Stack>
    </ConfirmDialog>
  );
}
