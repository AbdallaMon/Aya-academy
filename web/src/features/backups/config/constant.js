// Backup module constants + history-table column field map.
// Routes mirror server/src/modules/backups/backups.route.js under /backups
// (the ApiFetch client prepends the /api/v1 base URL automatically).

// Primary resource.
export const BACKUPS_URL = "/backups";

// Delete a specific backup — DELETE /backups/:id (id passed as the slug in fetchData).
export const BACKUPS_DELETE_URL = BACKUPS_URL;

// Derived sub-routes (actions + Drive + external).
export const BACKUPS_STATUS_URL = `${BACKUPS_URL}/status`;
export const BACKUPS_RUN_NOW_URL = `${BACKUPS_URL}/actions/run-now`;
export const BACKUPS_RESTORE_URL = `${BACKUPS_URL}/actions/restore`;
export const BACKUPS_RESTORE_EXTERNAL_CHECK_URL = `${BACKUPS_URL}/actions/restore-external/check`;
export const BACKUPS_RESTORE_EXTERNAL_COMMIT_URL = `${BACKUPS_URL}/actions/restore-external/commit`;
export const DRIVE_ACCOUNTS_URL = `${BACKUPS_URL}/drive/accounts`;
export const DRIVE_CONNECT_URL = `${BACKUPS_URL}/drive/connect`;

// Encryption keys stored on Drive — mirrors
// server/src/modules/encryptionKeys/encryptionKeys.route.js under /encryption-keys.
export const ENCRYPTION_KEYS_URL = "/encryption-keys";
export const ENCRYPTION_KEYS_GENERATE_URL = `${ENCRYPTION_KEYS_URL}/generate`;

// Builds the Drive-connect slug carrying the account type (KEY|DB) and an
// optional reconnectId — passed to fetchData as a slug so the path becomes
// /backups/drive/connect/?type=...&reconnectId=... (the backend reads type and
// reconnectId from the query string).
export function buildDriveConnectSlug({ type, reconnectId } = {}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (reconnectId != null) params.set("reconnectId", String(reconnectId));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// History-table column fields. headerName keys are localized via backupsData[lng]
// in the table component. renderCell receives ({ row, value }) as in DataTable.
export const HISTORY_COLUMN_FIELDS = {
  createdAt: "createdAt",
  fileName: "fileName",
  trigger: "trigger",
  status: "status",
  provider: "provider",
  location: "location",
  actions: "actions",
};
