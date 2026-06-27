"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";

/** Maps a backend coupon reason code to a localized message. */
function reasonText(reason, txt) {
  switch (reason) {
    case "COUPON_EXPIRED":
      return txt.couponExpired;
    case "COUPON_NOT_APPLICABLE":
      return txt.couponNotApplicable;
    case "COUPON_NOT_FOUND":
      return txt.couponNotFound;
    default:
      return txt.couponInvalid;
  }
}

export default function CouponField({
  code,
  status,
  reason,
  net,
  currency,
  disabled,
  verifying,
  onCodeChange,
  onVerify,
  onRemove,
  txt,
}) {
  const isValid = status === "valid";
  const isInvalid = status === "invalid";

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          label={txt.couponLabel}
          placeholder={txt.couponPlaceholder}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          size="small"
          fullWidth
          disabled={isValid || verifying}
        />
        {isValid ? (
          <Button
            color="error"
            variant="outlined"
            onClick={onRemove}
            sx={{ whiteSpace: "nowrap" }}
          >
            {txt.removeCoupon}
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={onVerify}
            disabled={disabled || verifying || !code.trim()}
            startIcon={verifying ? <CircularProgress size={16} /> : undefined}
            sx={{ whiteSpace: "nowrap" }}
          >
            {verifying ? txt.verifying : txt.verifyCoupon}
          </Button>
        )}
      </Stack>

      {disabled && (
        <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
          {txt.selectPlanFirst}
        </Box>
      )}

      {isValid && (
        <Alert severity="success" sx={{ py: 0 }}>
          {txt.couponApplied}
          {net != null ? ` — ${formatMoney(net, currency)}` : ""}
        </Alert>
      )}

      {isInvalid && (
        <Alert
          severity="error"
          sx={{ py: 0 }}
          action={
            <Button color="inherit" size="small" onClick={onRemove}>
              {txt.removeCoupon}
            </Button>
          }
        >
          {reasonText(reason, txt)}
        </Alert>
      )}
    </Stack>
  );
}
