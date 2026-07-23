"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  PLANS_PUBLIC_URL,
  SUBSCRIPTION_PLAN_QUOTE_URL,
  subscriptionPlanOptionsPath,
} from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";

const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

/**
 * Pick a plan + cycle (with the plan's removable default coupon) and request it.
 *
 * Reused for renewal too (subscriptionDetail/RenewDialog): pass `defaultPlanId` +
 * `defaultBillingPeriod` to preselect the current plan/cycle, and `title` /
 * `confirmLabel` / `confirmingLabel` to relabel for the renewal context.
 */
export default function PlanPickerDialog({
  open,
  onClose,
  child,
  onRequest,
  requesting,
  txt,
  defaultPlanId = null,
  title,
  confirmLabel,
  confirmingLabel,
}) {
  const { lng } = useTranslation();
  // MONTHLY-only in the UI for now — the yearly toggle is hidden.
  const billingPeriod = "MONTHLY";
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [coupon, setCoupon] = useState(EMPTY_COUPON);
  const studentId = child?.id ?? null;

  const plansReq = useRequest({
    url: studentId
      ? subscriptionPlanOptionsPath(studentId)
      : PLANS_PUBLIC_URL,
    method: "get",
    isPublic: !studentId,
    autoFetch: false,
    syncToUrl: false,
  });

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (open) {
      setSelectedPlanId(defaultPlanId);
      setCoupon(EMPTY_COUPON);
      plansReq.fetchData();
    }
  }, [open]);

  // Seed the preselected plan's default coupon once the public plans resolve.
  useEffect(() => {
    if (!open || !defaultPlanId) return;
    const p = (plansReq.data || []).find((x) => x.id === defaultPlanId);
    if (p) setCoupon(initialCoupon(p, billingPeriod));
  }, [open, plansReq.data]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const plans = plansReq.data || [];
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;

  function selectPlan(p) {
    setSelectedPlanId(p.id);
    setCoupon(initialCoupon(p, billingPeriod));
  }

  function confirm() {
    if (!selectedPlan) return;
    const resolved = resolveCoupon(selectedPlan, billingPeriod, coupon);
    onRequest(selectedPlan, {
      billingPeriod,
      couponCode:
        resolved.applied === "custom" ? resolved.codeToSend : undefined,
      applyPlanCoupon: resolved.applyPlanCoupon,
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title ?? `${txt.pickPlanTitle} ${child?.name || ""}`}
      maxWidth="md"
      showCloseIcon
      loading={requesting}
      submitText={
        requesting
          ? confirmingLabel ?? txt.requesting
          : confirmLabel ?? txt.request
      }
      cancelText={txt.cancel}
      onSubmit={confirm}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {plans.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            {txt.noPlans}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {plans.map((p) => {
              const cycle = p.monthly;
              const base = cycle?.base;
              const effective = cycle?.effective;
              const discount = cycle?.discount || null;
              const hasDiscount =
                discount != null && effective != null && effective < base;
              const discountLabel =
                discount &&
                (discount.type === "PERCENT"
                  ? `-${discount.value}%`
                  : `${formatMoney(discount.value, p.currency)} ${txt.discountChip}`);
              const selected = selectedPlanId === p.id;
              return (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    onClick={() => selectPlan(p)}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectPlan(p);
                      }
                    }}
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      borderColor: selected
                        ? "primary.main"
                        : p.isFeatured
                          ? "primary.light"
                          : "divider",
                      borderWidth: selected || p.isFeatured ? 2 : 1,
                      boxShadow: selected ? 4 : 0,
                      transition: "all .15s ease",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="h6" fontWeight={800}>
                          {lng === "en" ? p.titleEn : p.titleAr}
                        </Typography>
                        {selected ? (
                          <Chip size="small" color="primary" label="✓" />
                        ) : (
                          p.isFeatured && (
                            <Chip size="small" color="primary" label="★" />
                          )
                        )}
                      </Stack>

                      <Stack direction="row" alignItems="baseline" spacing={1}>
                        <Typography variant="h4" fontWeight={900} color="primary">
                          {formatMoney(hasDiscount ? effective : base, p.currency)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {txt.perMonth}
                        </Typography>
                      </Stack>

                      {hasDiscount && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mt={0.5}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textDecoration: "line-through" }}
                          >
                            {txt.was} {formatMoney(base, p.currency)}
                          </Typography>
                          {discountLabel && (
                            <Chip size="small" color="error" label={discountLabel} />
                          )}
                        </Stack>
                      )}

                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {p.hours} {txt.hours}
                      </Typography>
                      {(lng === "en" ? p.descriptionEn : p.descriptionAr) && (
                        <Typography variant="body2" mt={1}>
                          {lng === "en" ? p.descriptionEn : p.descriptionAr}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {selectedPlan && (
          <Box>
            <CouponControl
              plan={selectedPlan}
              billingPeriod={billingPeriod}
              coupon={coupon}
              onCoupon={setCoupon}
              quoteUrl={
                studentId ? SUBSCRIPTION_PLAN_QUOTE_URL : "plans/quote"
              }
              quoteBody={studentId ? { studentId } : {}}
            />
          </Box>
        )}
      </Stack>
    </FormDialog>
  );
}
