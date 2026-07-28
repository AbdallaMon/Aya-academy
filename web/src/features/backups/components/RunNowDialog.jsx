"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Radio,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { FiRefreshCw, FiPlay } from "react-icons/fi";
import { DRIVE_ACCOUNT_TYPES } from "@ayah/shared";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useBackupsText } from "../hooks/useBackupsText.js";
import {
  ENCRYPTION_KEYS_URL,
  DRIVE_CONNECT_URL,
  BACKUPS_RUN_NOW_URL,
  buildDriveConnectSlug,
} from "../config/constant.js";

/**
 * RunNowDialog — run a manual backup, choosing an encryption key.
 *   GET  /encryption-keys                                  — keys + account state
 *   GET  /backups/drive/connect?type=KEY&reconnectId=      — reconnect a key account
 *   POST /backups/actions/run-now { encryptionKeyId }      — run
 *
 * Only connected keys are selectable; disconnected ones are disabled with a
 * "reconnect the account" tooltip + reconnect button. If there are no keys → a
 * hint to go to the Keys tab.
 *
 * props: open, onClose, onDone, onGoToKeys
 */
export default function RunNowDialog({ open, onClose, onDone, onGoToKeys }) {
  const { tr } = useBackupsText();
  const [selectedId, setSelectedId] = useState(null);

  const keysReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
    onSuccess: (res) => {
      // Default selection = primary key if its account is connected, else the
      // first connected key.
      const list = Array.isArray(res?.data) ? res.data : [];
      const primary = list.find((k) => k.isPrimary && k.connected);
      const fallback = list.find((k) => k.connected);
      const next = primary || fallback;
      if (next) setSelectedId(next.id);
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

  const runNow = useRequest({
    url: BACKUPS_RUN_NOW_URL,
    method: "post",
    shouldAutoToast: true,
    onSuccess: () => {
      setSelectedId(null);
      onDone?.();
      onClose?.();
    },
  });

  // Fetch keys on every open (state may change after a reconnect). Default
  // selection is set in onSuccess (primary / first connected).
  useEffect(() => {
    if (open) keysReq.fetchData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const keys = Array.isArray(keysReq.data) ? keysReq.data : [];

  function reconnect(key) {
    const account = key.keyAccount;
    if (!account) return;
    connect
      .fetchData(
        buildDriveConnectSlug({
          type: account.type || DRIVE_ACCOUNT_TYPES.KEY,
          reconnectId: account.id,
        }),
      )
      .catch(() => {});
  }

  function submit() {
    if (selectedId == null) return;
    runNow.fetchData(null, { encryptionKeyId: selectedId }).catch(() => {});
  }

  const noKeys = !keysReq.isLoading && keys.length === 0;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={tr.runNowKeyTitle}
      subtitle={tr.runNowKeyHint}
      maxWidth="sm"
      loading={runNow.isLoading}
      actions={null}
    >
      {keysReq.isLoading && !keysReq.data ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : noKeys ? (
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined">
            {tr.runNowNoKeys}
          </Alert>
          <Box>
            <Button variant="contained" onClick={onGoToKeys}>
              {tr.runNowGoToKeys}
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {keys.map((key) => {
            const connected = Boolean(key.connected);
            const short = key.fingerprint ? key.fingerprint.slice(0, 8) : "";
            const account =
              key.keyAccount?.email || key.keyAccount?.label || "—";
            return (
              <Box
                key={key.id}
                onClick={() => connected && setSelectedId(key.id)}
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor:
                    selectedId === key.id ? "primary.main" : "divider",
                  borderRadius: 1,
                  cursor: connected ? "pointer" : "default",
                  opacity: connected ? 1 : 0.6,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Radio
                  checked={selectedId === key.id}
                  disabled={!connected}
                  size="small"
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body1" fontWeight={600}>
                      {key.name}
                    </Typography>
                    {key.isPrimary && (
                      <Chip size="small" color="primary" label={tr.primaryBadge} />
                    )}
                    {short && (
                      <Typography variant="caption" color="text.secondary">
                        {short}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {account}
                  </Typography>
                </Box>
                {!connected && (
                  <Tooltip title={tr.runNowKeyDisconnectedTip} arrow>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<FiRefreshCw />}
                      disabled={connect.isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        reconnect(key);
                      }}
                    >
                      {tr.reconnect}
                    </Button>
                  </Tooltip>
                )}
              </Box>
            );
          })}

          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                runNow.isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <FiPlay />
                )
              }
              disabled={selectedId == null || runNow.isLoading}
              onClick={submit}
            >
              {tr.runNowButton}
            </Button>
          </Box>
        </Stack>
      )}
    </FormDialog>
  );
}
