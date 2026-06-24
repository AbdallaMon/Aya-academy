"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { MdClose } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";

/**
 * FormDialog — dialog shell for embedding any form or content.
 *
 * Common props:
 *   open, onClose, title, subtitle, children
 *   onSubmit             handler for the submit button (often triggers a
 *                        form's requestSubmit)
 *   submitText/cancelText  default to localized "Save"/"Cancel"
 *   loading              disables actions + shows a spinner on submit
 *   maxWidth, fullWidth, fullScreen, showCloseIcon
 *   actions              ReactNode to fully replace the default action row
 *   extraActions         ReactNode prepended before Cancel
 *   errorSummary         ReactNode rendered atop the content
 */
export function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitText,
  cancelText,
  submitColor = "primary",
  submitVariant = "contained",
  loading = false,
  maxWidth = "sm",
  fullWidth = true,
  fullScreen = false,
  showCloseIcon = true,
  actions,
  extraActions,
  errorSummary,
  contentSx,
  PaperProps,
  sx,
  slotProps,
}) {
  const { t } = useTranslation();
  const labels = t("dialogs", { returnObjects: true }) || {};
  const resolvedSubmitText = submitText ?? labels.save ?? "Save";
  const resolvedCancelText = cancelText ?? labels.cancel ?? "Cancel";

  const handleBackdropClose = () => {
    if (loading) return;
    onClose?.();
  };

  return (
    <Dialog
      open={!!open}
      onClose={handleBackdropClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      sx={sx}
      slotProps={slotProps}
      PaperProps={{
        elevation: 6,
        sx: { borderRadius: fullScreen ? 0 : 2 },
        ...PaperProps,
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          pr: showCloseIcon ? 1 : 3,
          py: 2,
        }}
      >
        <Box>
          {typeof title === "string" ? (
            <Typography variant="h4" fontWeight={600}>
              {title}
            </Typography>
          ) : (
            title
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {showCloseIcon && (
          <IconButton
            onClick={onClose}
            disabled={loading}
            size="small"
            aria-label={labels.close || "close"}
            sx={{ mt: -0.25 }}
          >
            <MdClose size={20} />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3, ...contentSx }}>
        {errorSummary ? <Box sx={{ mb: 2 }}>{errorSummary}</Box> : null}
        {children}
      </DialogContent>

      {actions !== null && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            {actions ?? (
              <>
                {extraActions}
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onClose}
                  disabled={loading}
                >
                  {resolvedCancelText}
                </Button>
                {onSubmit && (
                  <Button
                    variant={submitVariant}
                    color={submitColor}
                    onClick={onSubmit}
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={16} color="inherit" /> : undefined
                    }
                  >
                    {resolvedSubmitText}
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

// Alias — some features refer to this shell as FormModal.
export { FormDialog as FormModal };
