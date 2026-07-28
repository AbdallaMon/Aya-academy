"use client";

// ConfirmDialog — confirmation modal (feature-local).
//
// Ayah's shared barrel has no ConfirmDialog, so this small helper lives inside the
// backups feature. It mirrors the API the asmaa backups feature relied on:
//   { open, intent: "danger"|"warning"|"info", title, description, confirmText,
//     cancelText, loading, maxWidth, onCancel, onConfirm,
//     renderActions?(), children }
//
// When `renderActions` is provided it fully replaces the confirm button (used by
// the restore flow to swap "Restore" ↔ "Retry restore"). When `children` is
// provided it renders alongside/instead of `description`.

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import { useTranslation } from "../../../i18n/client.js";

const INTENT_COLOR = {
  danger: "error",
  warning: "warning",
  info: "primary",
};

export default function ConfirmDialog({
  open,
  intent = "info",
  title,
  description,
  confirmText,
  cancelText,
  loading = false,
  maxWidth = "xs",
  onCancel,
  onConfirm,
  renderActions,
  children,
}) {
  const { t } = useTranslation();
  const labels = t("dialogs", { returnObjects: true }) || {};
  const color = INTENT_COLOR[intent] || "primary";
  const resolvedCancel = cancelText ?? labels.cancel ?? "Cancel";
  const resolvedConfirm = confirmText ?? labels.confirm ?? labels.save ?? "Confirm";

  function handleClose() {
    if (loading) return;
    onCancel?.();
  }

  return (
    <Dialog open={!!open} onClose={handleClose} maxWidth={maxWidth} fullWidth>
      {title && (
        <DialogTitle component="div" sx={{ fontWeight: 700, py: 2 }}>
          {title}
        </DialogTitle>
      )}
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        {description && (
          <DialogContentText component="div">{description}</DialogContentText>
        )}
        {children}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
        >
          {resolvedCancel}
        </Button>
        {renderActions ? (
          renderActions()
        ) : (
          <Button
            variant="contained"
            color={color}
            onClick={onConfirm}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {resolvedConfirm}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
