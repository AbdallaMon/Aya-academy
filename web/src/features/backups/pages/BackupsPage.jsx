"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { FiUploadCloud } from "react-icons/fi";
import { PERMISSIONS } from "@ayah/shared";
import { LoadingOverlay } from "../../../shared/components/index.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useBackupsText } from "../hooks/useBackupsText.js";
import {
  BACKUPS_STATUS_URL,
  ENCRYPTION_KEYS_URL,
} from "../config/constant.js";
import BackupStatusCard from "../components/BackupStatusCard.jsx";
import BackupHistoryTable from "../components/BackupHistoryTable.jsx";
import DriveAccountsSection from "../components/DriveAccountsSection.jsx";
import ExternalRestoreDialog from "../components/ExternalRestoreDialog.jsx";
import RunNowDialog from "../components/RunNowDialog.jsx";
import KeysSection from "../components/KeysSection.jsx";

const TABS = { backups: "backups", accounts: "accounts", keys: "keys" };

/**
 * BackupsPage — backup console with three tabs:
 *   1) «النسخ والاسترجاع» — status card + run-now (with key choice) + history + external restore.
 *   2) «الحسابات» — Google Drive accounts (KEY/DB): connect/disconnect/activate.
 *   3) «المفاتيح» — generate/save/manage the encryption keys stored on Drive.
 *
 * The whole page is gated by backup.manage. When there is no primary key (or no
 * keys at all) we show a warning in the backups tab (scheduled automatic backups
 * will be skipped) with a button that jumps to the Keys tab.
 */
export default function BackupsPage() {
  const { tr } = useBackupsText();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.BACKUP.MANAGE);

  // The OAuth return from Google lands on /dashboard/backups?drive=connected|error.
  // Start on the Accounts tab so DriveAccountsSection mounts and captures the
  // result (toast + URL cleanup). Reading via useSearchParams is consistent
  // between server and client (no setState inside an effect).
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() =>
    searchParams.get("drive") ? TABS.accounts : TABS.backups,
  );
  const [runNowOpen, setRunNowOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  // Signal that forces the history table to re-fetch (it owns its own useRequest).
  // Bumped after a successful manual backup or restore so the new backup shows at once.
  const [historySignal, setHistorySignal] = useState(0);

  const statusReq = useRequest({
    url: BACKUPS_STATUS_URL,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  // Keys list — to derive "no primary key" (backups-tab warning).
  const keysReq = useRequest({
    url: ENCRYPTION_KEYS_URL,
    method: "get",
    autoFetch: canManage,
    syncToUrl: false,
  });

  const keys = Array.isArray(keysReq.data) ? keysReq.data : [];
  const hasPrimaryKey = keys.some((k) => k.isPrimary);
  const noPrimaryKey = !keysReq.isLoading && keys.length > 0 && !hasPrimaryKey;
  const noKeysAtAll = !keysReq.isLoading && keys.length === 0;

  function refreshAll() {
    statusReq.triggerRefetch();
    keysReq.triggerRefetch();
    // Push the history table to re-fetch (it doesn't share our useRequest).
    setHistorySignal((s) => s + 1);
  }

  // When returning to the backups tab, re-fetch keys so the "no primary key"
  // warning reflects any change made in the keys/accounts tabs (generate/save/
  // set-primary/reconnect).
  useEffect(() => {
    if (canManage && tab === TABS.backups) keysReq.triggerRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!canManage) {
    return (
      <Container maxWidth="xxxxl" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
            {tr.pageTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {tr.pageDescription}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xxxxl" sx={{ mt: 2, mb: 4 }}>
      {/* Run a backup now, choosing an encryption key. */}
      <RunNowDialog
        open={runNowOpen}
        onClose={() => setRunNowOpen(false)}
        onDone={refreshAll}
        onGoToKeys={() => {
          setRunNowOpen(false);
          setTab(TABS.keys);
        }}
      />

      {/* Restore from an external file (.enc) — two-step (check then confirm). */}
      <ExternalRestoreDialog
        open={externalOpen}
        onClose={() => setExternalOpen(false)}
        onDone={refreshAll}
      />

      {/* Page header — backupsData strings directly (no registered namespace). */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h2" fontWeight={700}>
            {tr.pageTitle}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
            {tr.pageDescription}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FiUploadCloud />}
          onClick={() => setExternalOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          {tr.externalTitle}
        </Button>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, next) => setTab(next)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value={TABS.backups} label={tr.tabBackups} />
          <Tab value={TABS.accounts} label={tr.tabAccounts} />
          <Tab value={TABS.keys} label={tr.tabKeys} />
        </Tabs>
      </Box>

      {/* Backups & restore tab */}
      {tab === TABS.backups && (
        <Box sx={{ position: "relative" }}>
          <LoadingOverlay isLoading={statusReq.isLoading && !statusReq.data} />

          {(noPrimaryKey || noKeysAtAll) && (
            <Alert
              severity="warning"
              variant="outlined"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setTab(TABS.keys)}
                >
                  {tr.goToKeysAction}
                </Button>
              }
            >
              {noKeysAtAll ? tr.noKeysWarning : tr.noPrimaryKeyWarning}
            </Alert>
          )}

          <BackupStatusCard
            status={statusReq.data}
            loading={statusReq.isLoading}
            onRefresh={refreshAll}
            onRunNow={() => setRunNowOpen(true)}
            running={false}
          />

          <BackupHistoryTable
            canRestore={canManage}
            onChanged={refreshAll}
            refreshSignal={historySignal}
          />
        </Box>
      )}

      {/* Accounts tab */}
      {tab === TABS.accounts && (
        <DriveAccountsSection canManage={canManage} onChanged={refreshAll} />
      )}

      {/* Keys tab */}
      {tab === TABS.keys && <KeysSection canManage={canManage} />}
    </Container>
  );
}
