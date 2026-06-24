import dayjs from "dayjs";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";
import RowActions from "../components/RowActions.jsx";

/**
 * backupsColumns — column factory for the backup-history table.
 * Receives { tr, buildActions } where tr is backupsData[lng] and
 * buildActions(row) → an array of row actions.
 * Mirrors backups.dto.toBackupRow: { id, fileName, createdAt, trigger, status,
 *   provider, localPresent, drivePresent, fullyDeleted, driveAccountEmail,
 *   encryptionKey{ id, name, fingerprint }, canRestore,
 *   restoreUnavailableReasonCode, ... }.
 */
export function backupsColumns({ tr, buildActions }) {
  function providerLabel(p) {
    if (p === "drive") return tr.drive;
    if (p === "local") return tr.local;
    if (p === "s3") return tr.s3;
    return p || "—";
  }

  return [
    {
      field: "createdAt",
      headerName: "createdAt",
      width: 150,
      renderCell: ({ row }) =>
        row.createdAt ? dayjs(row.createdAt).format("DD/MM/YYYY HH:mm") : "—",
    },
    {
      field: "fileName",
      headerName: "fileName",
      width: 240,
    },
    {
      field: "trigger",
      headerName: "trigger",
      width: 110,
      renderCell: ({ row }) => tr[row.trigger] || row.trigger || "—",
    },
    {
      field: "status",
      headerName: "status",
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={tr[row.status] || row.status}
          color={row.status === "SUCCESS" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "provider",
      headerName: "provider",
      width: 130,
      renderCell: ({ row }) => providerLabel(row.provider),
    },
    {
      // Encrypting key: name + short fingerprint (Tooltip shows the full one).
      field: "key",
      headerName: "keyColumn",
      width: 180,
      renderCell: ({ row }) => {
        const key = row.encryptionKey;
        if (!key) {
          return (
            <Typography variant="caption" color="text.secondary">
              {tr.noKey}
            </Typography>
          );
        }
        const short = key.fingerprint ? key.fingerprint.slice(0, 8) : "";
        return (
          <Tooltip title={key.fingerprint || ""} arrow>
            <Stack spacing={0} sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {key.name}
              </Typography>
              {short && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {short}
                </Typography>
              )}
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      // DB account that holds the dump file.
      field: "dbAccount",
      headerName: "dbAccountColumn",
      width: 200,
      renderCell: ({ row }) => (
        <Typography variant="body2" noWrap>
          {row.driveAccountEmail || tr.noAccount}
        </Typography>
      ),
    },
    {
      field: "location",
      headerName: "location",
      width: 160,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.localPresent && (
            <Chip size="small" label={tr.presentLocal} variant="outlined" />
          )}
          {row.drivePresent && (
            <Chip size="small" label={tr.presentDrive} color="info" variant="outlined" />
          )}
          {row.fullyDeleted && (
            <Chip size="small" label={tr.deleted} color="default" variant="outlined" />
          )}
        </Stack>
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "colActions",
      width: 80,
      renderCell: ({ row }) => <RowActions row={row} actions={buildActions(row)} />,
    },
  ];
}
