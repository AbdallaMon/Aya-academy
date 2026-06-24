"use client";

// ConfirmDialog — shared confirmation modal.
//
// Replaces window.confirm/alert across the app. Drive it directly (controlled)
// or, preferably, through the imperative `useConfirm()` hook:
//
//   const confirm = useConfirm();
//   if (await confirm({ title, description, intent: "danger" })) { ...delete... }
//
// API: { open, intent: "danger"|"warning"|"info", title, description,
//        confirmText, cancelText, loading, maxWidth, icon, onCancel, onConfirm,
//        renderActions?(), children }

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { alpha } from "@mui/material/styles";
import { MdWarningAmber, MdErrorOutline, MdInfoOutline } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";

const INTENT_COLOR = {
  danger: "error",
  warning: "warning",
  info: "primary",
};

const INTENT_ICON = {
  danger: MdErrorOutline,
  warning: MdWarningAmber,
  info: MdInfoOutline,
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
  icon,
  onCancel,
  onConfirm,
  renderActions,
  children,
}) {
  const { t } = useTranslation();
  const labels = t("dialogs", { returnObjects: true }) || {};
  const color = INTENT_COLOR[intent] || "primary";
  const resolvedCancel = cancelText ?? labels.cancel ?? "إلغاء";
  const resolvedConfirm = confirmText ?? labels.confirm ?? labels.save ?? "تأكيد";
  const Icon = icon ?? INTENT_ICON[intent] ?? MdInfoOutline;

  function handleClose() {
    if (loading) return;
    onCancel?.();
  }

  return (
    <Dialog
      open={!!open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      <DialogContent sx={{ pt: 4, pb: 2, textAlign: "center" }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: `${color}.main`,
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.12),
          }}
        >
          <Icon size={32} />
        </Box>
        {title && (
          <DialogTitle
            component="div"
            sx={{ fontWeight: 800, p: 0, mb: 1, fontSize: "1.25rem" }}
          >
            {title}
          </DialogTitle>
        )}
        {description && (
          <DialogContentText component="div" sx={{ color: "text.secondary" }}>
            {description}
          </DialogContentText>
        )}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, justifyContent: "center" }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          sx={{ minWidth: 110 }}
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
            sx={{ minWidth: 110 }}
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
