"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FiPlus,
  FiCheckCircle,
  FiActivity,
  FiLink,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { DRIVE_ACCOUNT_TYPES } from "@aya/shared";
import { useRequest } from "../../../hooks/request/useRequest.js";
import useDebounce from "../../../hooks/useDebounce.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useBackupsText } from "../hooks/useBackupsText.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import RowActions from "./RowActions.jsx";
import ConnectAccountDialog from "./ConnectAccountDialog.jsx";
import {
  DRIVE_ACCOUNTS_URL,
  DRIVE_CONNECT_URL,
  buildDriveConnectSlug,
} from "../config/constant.js";

/**
 * DriveAccountsSection — Google Drive accounts (multi-account, two kinds KEY/DB).
 *   GET    /backups/drive/accounts                          — list (row carries type)
 *   GET    /backups/drive/connect?type=KEY|DB[&reconnectId=] — returns { authUrl } opened in a new tab
 *   POST   /backups/drive/accounts/:id/actions/set-active   (DB accounts only)
 *   POST   /backups/drive/accounts/:id/actions/check
 *   POST   /backups/drive/accounts/:id/actions/disconnect
 *   DELETE /backups/drive/accounts/:id
 *
 * Captures ?drive=connected|error from the OAuth redirect, toasts, then cleans
 * the URL.
 *
 * props: canManage, onChanged
 */
export default function DriveAccountsSection({ canManage, onChanged }) {
  const { tr } = useBackupsText();
  const { showToast } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const [toDelete, setToDelete] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);

  // Search (email/label) + type filter (KEY|DB). A plain GET doesn't serialize
  // params, so we build a query string and append it to the url; changing it
  // recreates fetchData, which re-fetches automatically.
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const accountsUrl = useMemo(() => {
    const params = new URLSearchParams();
    const s = debouncedSearch.trim();
    if (s) params.set("search", s);
    if (type) params.set("type", type);
    const qs = params.toString();
    return qs ? `${DRIVE_ACCOUNTS_URL}?${qs}` : DRIVE_ACCOUNTS_URL;
  }, [debouncedSearch, type]);

  const list = useRequest({
    url: accountsUrl,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  function refresh() {
    list.triggerRefetch();
    onChanged?.();
  }

  // connect/reconnect an account — carries the type (and reconnectId on reconnect).
  const connect = useRequest({
    url: DRIVE_CONNECT_URL,
    method: "get",
    syncToUrl: false,
    onSuccess: (res) => {
      const url = res?.data?.authUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    },
  });

  // per-account actions (POST/DELETE) — path built via slug.
  const setActiveReq = useRequest({
    url: DRIVE_ACCOUNTS_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: refresh,
  });
  const checkReq = useRequest({
    url: DRIVE_ACCOUNTS_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: refresh,
  });
  const disconnectReq = useRequest({
    url: DRIVE_ACCOUNTS_URL,
    method: "post",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: refresh,
  });
  const deleteReq = useRequest({
    url: DRIVE_ACCOUNTS_URL,
    method: "delete",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => {
      setToDelete(null);
      refresh();
    },
  });

  // Open OAuth to connect a new account with the chosen type.
  function connectNew(nextType) {
    setConnectOpen(false);
    connect.fetchData(buildDriveConnectSlug({ type: nextType })).catch(() => {});
  }

  // Reconnect an existing account (same identity) — pass its type + reconnectId.
  function reconnectAccount(account) {
    connect
      .fetchData(
        buildDriveConnectSlug({
          type: account.type || DRIVE_ACCOUNT_TYPES.DB,
          reconnectId: account.id,
        }),
      )
      .catch(() => {});
  }

  // Capture the OAuth result from the URL (drive=connected|error) then clean it.
  useEffect(() => {
    const drive = sp.get("drive");
    if (!drive) return;
    if (drive === "connected") {
      showToast({ message: tr.driveConnected, severity: "success" });
      refresh();
    } else if (drive === "error") {
      showToast({ message: tr.driveError, severity: "error" });
    }
    const p = new URLSearchParams(sp.toString());
    p.delete("drive");
    p.delete("reason");
    router.replace(`?${p.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const accounts = Array.isArray(list.data) ? list.data : [];
  const isFiltering = Boolean(debouncedSearch.trim()) || Boolean(type);
  const busy =
    setActiveReq.isLoading ||
    checkReq.isLoading ||
    disconnectReq.isLoading ||
    deleteReq.isLoading;

  function typeBadge(accountType) {
    const isKey = accountType === DRIVE_ACCOUNT_TYPES.KEY;
    return (
      <Chip
        size="small"
        color={isKey ? "secondary" : "info"}
        variant="filled"
        label={isKey ? tr.typeKey : tr.typeDb}
      />
    );
  }

  function buildActions(account) {
    const isDb =
      (account.type || DRIVE_ACCOUNT_TYPES.DB) === DRIVE_ACCOUNT_TYPES.DB;
    return [
      {
        key: "setActive",
        label: tr.setActive,
        icon: FiCheckCircle,
        color: "success",
        // Activation is DB-accounts only (upload destination) and only when inactive.
        hidden: !isDb || account.isActive,
        onClick: (a) => setActiveReq.fetchData(`${a.id}/actions/set-active`, {}),
      },
      {
        key: "check",
        label: tr.checkConnection,
        icon: FiActivity,
        onClick: (a) => checkReq.fetchData(`${a.id}/actions/check`, {}),
      },
      {
        key: "reconnect",
        label: tr.reconnect,
        icon: FiRefreshCw,
        color: "primary",
        // Reconnect shows for disconnected accounts.
        hidden: account.connected,
        onClick: (a) => reconnectAccount(a),
      },
      {
        key: "disconnect",
        label: tr.disconnect,
        icon: FiLink,
        color: "warning",
        hidden: !account.connected,
        onClick: (a) => disconnectReq.fetchData(`${a.id}/actions/disconnect`, {}),
      },
      {
        key: "delete",
        label: tr.deleteAccount,
        icon: FiTrash2,
        color: "error",
        disabled: account.hasBackups,
        onClick: (a) => setToDelete(a),
      },
    ];
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <ConfirmDialog
          open={Boolean(toDelete)}
          intent="danger"
          title={tr.deleteAccountTitle}
          description={tr.deleteAccountBody}
          confirmText={tr.deleteAccountConfirm}
          loading={deleteReq.isLoading}
          onCancel={() => setToDelete(null)}
          onConfirm={() => deleteReq.fetchData(String(toDelete.id)).catch(() => {})}
        />

        <ConnectAccountDialog
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          onChoose={connectNew}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {tr.driveTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tr.driveHint}
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              disabled={connect.isLoading}
              onClick={() => setConnectOpen(true)}
            >
              {tr.connectDrive}
            </Button>
          )}
        </Stack>

        {/* Search (email/label) + type filter — passed as query to the backend. */}
        {canManage && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mb: 2 }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              size="small"
              placeholder={tr.accountsSearchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240 }}
            />
            <TextField
              select
              size="small"
              label={tr.accountsTypeFilter}
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">{tr.accountsTypeAll}</MenuItem>
              <MenuItem value={DRIVE_ACCOUNT_TYPES.KEY}>{tr.typeKey}</MenuItem>
              <MenuItem value={DRIVE_ACCOUNT_TYPES.DB}>{tr.typeDb}</MenuItem>
            </TextField>
          </Stack>
        )}

        {list.isLoading && accounts.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : accounts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            {isFiltering ? tr.noAccountsFiltered : tr.noAccounts}
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {accounts.map((a) => (
              <Stack
                key={a.id}
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
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body1" fontWeight={600}>
                      {a.email || a.label || `#${a.id}`}
                    </Typography>
                    {typeBadge(a.type)}
                    {a.isActive && (
                      <Chip size="small" color="primary" label={tr.activeBadge} />
                    )}
                    <Chip
                      size="small"
                      variant="outlined"
                      color={a.connected ? "success" : "warning"}
                      label={a.connected ? tr.connected : tr.disconnected}
                    />
                  </Stack>
                  {a.label && a.email && (
                    <Typography variant="caption" color="text.secondary">
                      {a.label}
                    </Typography>
                  )}
                </Box>
                {canManage && (
                  <Box sx={{ opacity: busy ? 0.6 : 1 }}>
                    <RowActions row={a} actions={buildActions(a)} />
                  </Box>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
