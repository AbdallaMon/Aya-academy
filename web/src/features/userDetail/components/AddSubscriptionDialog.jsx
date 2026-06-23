"use client";

import { useEffect, useMemo, useState } from "react";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { SUBSCRIPTIONS_URL, PLANS_URL } from "../config/constant.js";

function addPeriod(dateStr, billingPeriod) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (billingPeriod === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Create an ACTIVE subscription for a preselected student.
 *   POST subscriptions { studentId, planId?, startDate, endDate, status:"ACTIVE" }
 */
export default function AddSubscriptionDialog({ open, onClose, studentId, studentName, txt, onSuccess }) {
  const { lng } = useTranslation();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addPeriod(today, "MONTHLY"));

  const plansReq = useRequest({
    url: PLANS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });

  const createReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  useEffect(() => {
    if (open) {
      setPlanId("");
      setStartDate(today);
      setEndDate(addPeriod(today, "MONTHLY"));
      plansReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plansReq.data || [];

  function onPlanChange(id) {
    setPlanId(id);
    const plan = plans.find((p) => String(p.id) === String(id));
    if (plan) setEndDate(addPeriod(startDate, plan.billingPeriod));
  }

  function onStartChange(v) {
    setStartDate(v);
    const plan = plans.find((p) => String(p.id) === String(planId));
    setEndDate(addPeriod(v, plan?.billingPeriod || "MONTHLY"));
  }

  function submit() {
    if (!studentId || !startDate || !endDate) return;
    createReq.fetchData(null, {
      studentId: Number(studentId),
      planId: planId ? Number(planId) : undefined,
      startDate,
      endDate,
      status: "ACTIVE",
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.addSubscription}
      subtitle={studentName}
      maxWidth="sm"
      loading={createReq.isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {studentName}
        </Typography>
        <TextField
          select
          label={txt.plan}
          value={planId}
          onChange={(e) => onPlanChange(e.target.value)}
          fullWidth
        >
          {plans.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {lng === "en" ? p.titleEn : p.titleAr}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={2}>
          <TextField
            type="date"
            label={txt.startDate}
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            type="date"
            label={txt.endDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </Stack>
    </FormDialog>
  );
}
