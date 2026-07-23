"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Typography } from "@mui/material";
import ChildEnrollCard from "../../auth/components/ChildEnrollCard.jsx";
import { useAuthText } from "../../auth/config/authText.js";
import { FormDialog, applyApiErrorsToForm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import {
  CREATE_STUDENT_URL,
  PLANS_PUBLIC_URL,
  SUBSCRIPTION_REQUEST_URL,
} from "../config/constant.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyChild() {
  return {
    name: "",
    email: "",
    password: "",
    nickname: "",
    birthDate: "",
    billingPeriod: "MONTHLY",
    planId: null,
    coupon: initialCoupon(null, "MONTHLY"),
  };
}

/**
 * Registration-style "add child": collects the child's details, plan + billing
 * cycle, and an optional coupon in one card (reuses ChildEnrollCard). On submit
 * it creates the student, then files the PENDING subscription request for the
 * chosen plan — mirroring the public enroll wizard for a logged-in parent.
 */
export default function AddChildDialog({ open, onClose, lng, txt, onCreated }) {
  const authTxt = useAuthText();
  const [formError, setFormError] = useState(null);

  // The whole child object lives in a single RHF field; ChildEnrollCard (shared
  // with the auth wizard) still drives the individual inputs through child/onChange,
  // so we bridge its patches into the form value and read it back with useWatch.
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: { child: emptyChild() },
  });
  const child = useWatch({ control, name: "child" }) || emptyChild();

  const plansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  const createChildMut = useMultiRequest({ url: CREATE_STUDENT_URL });
  const requestMut = useMultiRequest({ url: SUBSCRIPTION_REQUEST_URL });
  const loading =
    createChildMut.isPostRequestLoading || requestMut.isPostRequestLoading;

  // Re-seed a clean form and fetch the public plans whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    reset({ child: emptyChild() });
    plansReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plansReq.data || [];

  // ChildEnrollCard patches one or more keys at a time; merge into the form value.
  const patch = (p) =>
    setValue("child", { ...child, ...p }, { shouldDirty: true });

  // ChildEnrollCard expects an error dict keyed by field name; project RHF errors.
  const childErrs = errors.child || {};
  const fieldErrors = {
    ...(childErrs.name ? { name: childErrs.name.message } : {}),
    ...(childErrs.email ? { email: childErrs.email.message } : {}),
    ...(childErrs.password ? { password: childErrs.password.message } : {}),
    ...(childErrs.planId ? { planId: childErrs.planId.message } : {}),
  };

  function validate(values) {
    clearErrors();
    let ok = true;
    if (!values.name.trim()) {
      setError("child.name", { type: "validate", message: authTxt.required });
      ok = false;
    }
    if (!EMAIL_RE.test(values.email.trim())) {
      setError("child.email", { type: "validate", message: authTxt.invalidEmail });
      ok = false;
    }
    if ((values.password || "").length < 6) {
      setError("child.password", {
        type: "validate",
        message: authTxt.passwordShort,
      });
      ok = false;
    }
    if (!values.planId) {
      setError("child.planId", { type: "validate", message: authTxt.planRequired });
      ok = false;
    }
    return ok;
  }

  function handleClose() {
    if (loading) return;
    reset({ child: emptyChild() });
    setFormError(null);
    onClose();
  }

  async function submit({ child: values }) {
    setFormError(null);
    if (!validate(values)) {
      setFormError(authTxt.fixErrors);
      return;
    }

    const plan = plans.find((p) => p.id === values.planId) || null;
    const resolved = resolveCoupon(plan, values.billingPeriod, values.coupon);

    let res;
    try {
      res = await createChildMut.postRequest(null, {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        nickname: values.nickname.trim() || undefined,
        birthDate: values.birthDate || undefined,
      });
    } catch (err) {
      // creation failed (e.g. email taken) — toast already shown; map any field
      // errors onto the form and keep the dialog open.
      applyApiErrorsToForm(err, (path, e) => setError(`child.${path}`, e), {
        suppressFallbackToast: true,
      });
      return;
    }

    const childId = res?.data?.id;
    if (!childId) return;

    try {
      await requestMut.postRequest(null, {
        studentId: childId,
        planId: values.planId,
        billingPeriod: values.billingPeriod,
        ...(resolved.applied === "custom" && resolved.codeToSend
          ? { couponCode: resolved.codeToSend }
          : {}),
        applyPlanCoupon: resolved.applyPlanCoupon,
      });
    } catch {
      // child created but the subscription request failed — toast shown; still
      // refresh + close so the new child appears (parent can request a plan again)
    }

    onCreated?.();
    reset({ child: emptyChild() });
    setFormError(null);
    onClose();
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={txt.addChildTitle}
      maxWidth="md"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={handleSubmit(submit)}
    >
      <ChildEnrollCard
        index={0}
        child={child}
        plans={plans}
        onChange={patch}
        canRemove={false}
        errors={fieldErrors}
        txt={authTxt}
        lng={lng}
      />
      {formError && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {formError}
        </Typography>
      )}
    </FormDialog>
  );
}
