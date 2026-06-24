"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  FiKey,
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiTrash2,
} from "react-icons/fi";
import { DRIVE_ACCOUNT_TYPES } from "@aya/shared";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useBackupsText } from "../hooks/useBackupsText.js";
import {
  ENCRYPTION_KEYS_URL,
  DRIVE_ACCOUNTS_URL,
  DRIVE_CONNECT_URL,
  buildDriveConnectSlug,
} from "../config/constant.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import RowActions from "./RowActions.jsx";
import GenerateKeyDialog from "./GenerateKeyDialog.jsx";

/**
 * KeysSection — «المفاتيح» tab: generate/save/manage encryption keys stored on Drive.
 *   POST   /encryption-keys/generate                  — generate (shown once)
 *   POST   /encryption-keys { name, key, keyAccountId } — save to a KEY account
 *   GET    /encryption-keys                            — list (+ connected per key)
 *   POST   /encryption-keys/:id/actions/set-primary
 *   DELETE /encryption-keys/:id
 *   GET    /backups/drive/accounts                     — to pick a KEY account for save
 *
 * Each key row shows its holding account, connection status, a primary badge and
 * a (short) fingerprint. The generate-once key is handed to the save form via
 * GenerateKeyDialog's onUseKey; saving persists it to the chosen KEY account.
 *
 * ConfirmDialog/RowActions are feature-local in aya (not in the shared barrel),
 * so they are imported from this folder.
 *
 * props: canManage
 */
export default function KeysSection({ canManage }) {
  const { tr } = useBackupsText();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [name, setName] = useState("");
  const [keyAccountId, setKeyAccountId] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [toPrimary, setToPrimary] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const keysReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  const accountsReq = useRequest({
    url: DRIVE_ACCOUNTS_URL,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  const saveReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => {
      resetForm();
      keysReq.triggerRefetch();
    },
  });

  const setPrimaryReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => {
      setToPrimary(null);
      keysReq.triggerRefetch();
    },
  });

  const deleteReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "delete",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => {
      setToDelete(null);
      keysReq.triggerRefetch();
    },
  });

  // Connect/reconnect a KEY account (so disconnected key accounts become
  // selectable in the save form).
  const connect = useRequest({
    url: DRIVE_CONNECT_URL,
    method: "get",
    syncToUrl: false,
    onSuccess: (res) => {
      const url = res?.data?.authUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    },
  });

  const keys = Array.isArray(keysReq.data) ? keysReq.data : [];

  // KEY accounts only — eligible holders for a saved key.
  const keyAccounts = useMemo(() => {
    const accounts = Array.isArray(accountsReq.data) ? accountsReq.data : [];
    return accounts.filter((a) => a.type === DRIVE_ACCOUNT_TYPES.KEY);
  }, [accountsReq.data]);
  const hasConnectedKeyAccount = keyAccounts.some((a) => a.connected);

  // The chosen account is valid only if it is among the current KEY accounts
  // (otherwise treat it as empty without writing state inside an effect).
  const resolvedAccountId = keyAccounts.some(
    (a) => String(a.id) === String(keyAccountId),
  )
    ? keyAccountId
    : "";

  function resetForm() {
    setName("");
    setKeyAccountId("");
    setKeyValue("");
  }

  function reconnectKeyAccount(account) {
    connect
      .fetchData(
        buildDriveConnectSlug({
          type: DRIVE_ACCOUNT_TYPES.KEY,
          reconnectId: account.id,
        }),
      )
      .catch(() => {});
  }

  function submitSave() {
    if (!name.trim() || resolvedAccountId === "" || !keyValue.trim()) return;
    saveReq
      .fetchData(null, {
        name: name.trim(),
        key: keyValue.trim(),
        keyAccountId: Number(resolvedAccountId),
      })
      .catch(() => {});
  }

  function buildActions(key) {
    return [
      {
        key: "setPrimary",
        label: tr.setPrimary,
        icon: FiStar,
        color: "primary",
        hidden: key.isPrimary,
        onClick: (k) => setToPrimary(k),
      },
      {
        key: "delete",
        label: tr.deleteKey,
        icon: FiTrash2,
        color: "error",
        onClick: (k) => setToDelete(k),
      },
    ];
  }

  return (
    <Stack spacing={3}>
      <GenerateKeyDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onUseKey={(base64) => setKeyValue(base64 || "")}
      />

      <ConfirmDialog
        open={Boolean(toPrimary)}
        intent="warning"
        title={tr.setPrimary}
        description={tr.setPrimaryConfirmBody}
        confirmText={tr.setPrimary}
        loading={setPrimaryReq.isLoading}
        onCancel={() => setToPrimary(null)}
        onConfirm={() =>
          setPrimaryReq
            .fetchData(`${toPrimary?.id}/actions/set-primary`, {})
            .catch(() => {})
        }
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        intent="danger"
        title={tr.deleteKeyTitle}
        description={tr.deleteKeyBody}
        confirmText={tr.deleteKeyConfirm}
        loading={deleteReq.isLoading}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          deleteReq.fetchData(String(toDelete?.id)).catch(() => {})
        }
      />

      {/* Generate + save a key */}
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {tr.saveKeyTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tr.keysHint}
              </Typography>
            </Box>
            {canManage && (
              <Button
                variant="outlined"
                startIcon={<FiKey />}
                onClick={() => setGenerateOpen(true)}
              >
                {tr.generateKey}
              </Button>
            )}
          </Stack>

          {canManage && keyAccounts.length > 0 && !hasConnectedKeyAccount && (
            <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
              {tr.saveKeyNoAccounts}
            </Alert>
          )}

          {canManage && keyAccounts.length === 0 ? (
            <Alert severity="info" variant="outlined">
              {tr.saveKeyNoAccounts}
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label={tr.saveKeyName}
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                sx={{ maxWidth: 480 }}
              />

              <TextField
                select
                label={tr.saveKeyAccount}
                size="small"
                value={resolvedAccountId}
                onChange={(e) => setKeyAccountId(e.target.value)}
                fullWidth
                sx={{ maxWidth: 480 }}
                helperText={tr.saveKeySelectAccount}
              >
                {keyAccounts.map((a) => (
                  <MenuItem
                    key={a.id}
                    value={String(a.id)}
                    disabled={!a.connected}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ width: "100%" }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {a.email || a.label || `#${a.id}`}
                      </Typography>
                      {!a.connected && (
                        <Chip
                          size="small"
                          color="warning"
                          variant="outlined"
                          label={tr.disconnected}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              {/* Reconnect disconnected KEY accounts so they become selectable. */}
              {keyAccounts.some((a) => !a.connected) && (
                <Stack spacing={1}>
                  {keyAccounts
                    .filter((a) => !a.connected)
                    .map((a) => (
                      <Stack
                        key={a.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          maxWidth: 480,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {a.email || a.label || `#${a.id}`}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<FiRefreshCw />}
                          disabled={connect.isLoading}
                          onClick={() => reconnectKeyAccount(a)}
                        >
                          {tr.reconnect}
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              )}

              <TextField
                label={tr.saveKeyKey}
                size="small"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={{ maxWidth: 480 }}
              />

              <Box>
                <Button
                  variant="contained"
                  startIcon={
                    saveReq.isLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FiPlus />
                    )
                  }
                  disabled={
                    !canManage ||
                    saveReq.isLoading ||
                    !name.trim() ||
                    resolvedAccountId === "" ||
                    !keyValue.trim()
                  }
                  onClick={submitSave}
                >
                  {tr.saveKeySubmit}
                </Button>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            {tr.keysTitle}
          </Typography>

          {keysReq.isLoading && keys.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : keys.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              {tr.noKeys}
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {keys.map((key) => {
                const short = key.fingerprint
                  ? key.fingerprint.slice(0, 8)
                  : "";
                const account =
                  key.keyAccount?.email || key.keyAccount?.label || "—";
                return (
                  <Stack
                    key={key.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
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
                          <Chip
                            size="small"
                            color="primary"
                            icon={<FiStar size={14} />}
                            label={tr.primaryBadge}
                          />
                        )}
                        <Chip
                          size="small"
                          variant="outlined"
                          color={key.connected ? "success" : "warning"}
                          label={key.connected ? tr.connected : tr.disconnected}
                        />
                        {short && (
                          <Tooltip title={key.fingerprint || ""} arrow>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {short}
                            </Typography>
                          </Tooltip>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {account}
                        {key.createdAt
                          ? ` · ${dayjs(key.createdAt).format("DD/MM/YYYY")}`
                          : ""}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {!key.connected && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<FiRefreshCw />}
                          disabled={connect.isLoading || !key.keyAccount}
                          onClick={() =>
                            key.keyAccount &&
                            reconnectKeyAccount(key.keyAccount)
                          }
                        >
                          {tr.reconnect}
                        </Button>
                      )}
                      {canManage && (
                        <RowActions row={key} actions={buildActions(key)} />
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
