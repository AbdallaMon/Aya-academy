"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRequest } from "../../hooks/request/useRequest.js";
import { useTranslation } from "../../i18n/client.js";
import { formatMoney } from "../lib/money.js";
import { planCouponOf } from "../lib/couponPricing.js";

// Self-contained bilingual copy so any feature can drop this in without wiring
// its own coupon strings.
const TXT = {
  ar: {
    label: "كود الخصم",
    placeholder: "أدخل كود خصم",
    verify: "تحقق",
    verifying: "جارٍ التحقق…",
    remove: "إزالة الخصم",
    planApplied: "🎁 خصم الباقة مطبّق",
    customApplied: "تم تطبيق الخصم 🎉",
    restore: "استرجاع خصم الباقة",
    invalid: "كود الخصم غير صالح",
    expired: "انتهت صلاحية كود الخصم",
    notApplicable: "الكوبون لا ينطبق على هذه الباقة أو الدورة",
    notFound: "كود الخصم غير موجود",
    removed: "تمت إزالة الخصم — السعر بدون خصم",
  },
  en: {
    label: "Coupon code",
    placeholder: "Enter a coupon code",
    verify: "Verify",
    verifying: "Verifying…",
    remove: "Remove discount",
    planApplied: "🎁 Plan discount applied",
    customApplied: "Discount applied 🎉",
    restore: "Restore plan discount",
    invalid: "Invalid coupon code",
    expired: "Coupon code expired",
    notApplicable: "Coupon does not apply to this plan or cycle",
    notFound: "Coupon code not found",
    removed: "Discount removed — price without discount",
  },
};

function reasonText(reason, t) {
  switch (reason) {
    case "COUPON_EXPIRED":
      return t.expired;
    case "COUPON_NOT_APPLICABLE":
      return t.notApplicable;
    case "COUPON_NOT_FOUND":
      return t.notFound;
    default:
      return t.invalid;
  }
}

/**
 * Coupon UX for one selected plan + cycle. The plan's own coupon is shown as a
 * removable default; the user can remove it (→ base price) or type a custom code
 * (verified server-side via POST /plans/quote). Removing never auto-re-adds.
 *
 * Props:
 *  - plan: a `/plans/public`-shaped plan (or null)
 *  - billingPeriod: "MONTHLY" | "YEARLY"
 *  - coupon: state object (see couponPricing.js)
 *  - onCoupon(next): replace the coupon state
 *  - currency?: overrides plan.currency for formatting
 */
export default function CouponControl({ plan, billingPeriod, coupon, onCoupon, currency }) {
  const { lng } = useTranslation();
  const t = TXT[lng === "en" ? "en" : "ar"];
  const cur = currency || plan?.currency;
  const planCoupon = planCouponOf(plan, billingPeriod);

  const quoteReq = useRequest({
    url: "plans/quote",
    method: "post",
    isPublic: true,
    syncToUrl: false,
  });

  const [code, setCode] = useState("");

  const status = coupon?.status || "idle";
  const applied = status === "plan" || status === "custom";

  const planDiscountLabel =
    planCoupon &&
    (planCoupon.type === "PERCENT"
      ? `-${planCoupon.value}%`
      : `-${formatMoney(planCoupon.value, cur)}`);

  async function verify() {
    if (!plan?.id || !code.trim()) return;
    try {
      const res = await quoteReq.fetchData(null, {
        planId: plan.id,
        billingPeriod,
        couponCode: code.trim(),
      });
      const data = res?.data;
      if (data?.couponValid) {
        onCoupon({ status: "custom", code: code.trim(), quote: data, reason: null });
      } else {
        onCoupon({ status: "invalid", code: code.trim(), quote: null, reason: data?.reason || null });
      }
    } catch {
      onCoupon({ status: "invalid", code: code.trim(), quote: null, reason: null });
    }
  }

  function remove() {
    setCode("");
    onCoupon({ status: "none", code: "", quote: null, reason: null });
  }

  function restore() {
    setCode("");
    onCoupon({ status: "plan", code: "", quote: null, reason: null });
  }

  // ── Applied (plan default OR verified custom): chip + remove ──
  if (applied) {
    const isPlan = status === "plan";
    return (
      <Alert
        severity="success"
        icon={false}
        action={
          <Button color="error" size="small" onClick={remove}>
            {t.remove}
          </Button>
        }
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={700}>
            {isPlan ? t.planApplied : t.customApplied}
          </Typography>
          {isPlan && planCoupon && (
            <Chip size="small" color="success" label={planCoupon.code} />
          )}
          {isPlan && planDiscountLabel && (
            <Chip size="small" color="error" label={planDiscountLabel} />
          )}
          {!isPlan && coupon.code && (
            <Chip size="small" color="success" label={coupon.code} />
          )}
          {!isPlan && coupon.quote?.net != null && (
            <Typography variant="caption" color="text.secondary">
              {formatMoney(coupon.quote.net, cur)}
            </Typography>
          )}
        </Stack>
      </Alert>
    );
  }

  // ── Input (idle / none / invalid): text field + verify, optional restore ──
  return (
    <Stack spacing={1}>
      {status === "none" && (
        <Alert severity="info" sx={{ py: 0 }}>
          {t.removed}
        </Alert>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
      >
        <TextField
          label={t.label}
          placeholder={t.placeholder}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          size="small"
          fullWidth
          disabled={quoteReq.isLoading}
        />
        <Button
          variant="outlined"
          onClick={verify}
          disabled={!plan?.id || quoteReq.isLoading || !code.trim()}
          startIcon={quoteReq.isLoading ? <CircularProgress size={16} /> : undefined}
          sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" } }}
        >
          {quoteReq.isLoading ? t.verifying : t.verify}
        </Button>
      </Stack>
      {status === "invalid" && (
        <Alert severity="error" sx={{ py: 0 }}>
          {reasonText(coupon?.reason, t)}
        </Alert>
      )}
      {planCoupon && (status === "none" || status === "invalid") && (
        <Box>
          <Button size="small" onClick={restore}>
            {t.restore}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
