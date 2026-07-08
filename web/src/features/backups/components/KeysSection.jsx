"use client";

import { useMemo, useState } from "react";
import { Stack } from "@mui/material";
import { FiStar, FiTrash2 } from "react-icons/fi";
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
import GenerateKeyDialog from "./GenerateKeyDialog.jsx";
import KeySaveCard from "./KeySaveCard.jsx";
import KeysListCard from "./KeysListCard.jsx";

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
 * so they are imported from this folder. The generate/save card and the keys
 * list (+ row) are extracted into KeySaveCard/KeysListCard/KeyRow; this stays a
 * thin composer holding state, requests and handlers.
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
      <KeySaveCard
        canManage={canManage}
        tr={tr}
        keyAccounts={keyAccounts}
        hasConnectedKeyAccount={hasConnectedKeyAccount}
        name={name}
        setName={setName}
        resolvedAccountId={resolvedAccountId}
        setKeyAccountId={setKeyAccountId}
        keyValue={keyValue}
        setKeyValue={setKeyValue}
        connect={connect}
        reconnectKeyAccount={reconnectKeyAccount}
        submitSave={submitSave}
        saveLoading={saveReq.isLoading}
        onGenerate={() => setGenerateOpen(true)}
      />

      {/* Keys list */}
      <KeysListCard
        tr={tr}
        isLoading={keysReq.isLoading}
        keys={keys}
        canManage={canManage}
        connect={connect}
        reconnectKeyAccount={reconnectKeyAccount}
        buildActions={buildActions}
      />
    </Stack>
  );
}
