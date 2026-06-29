"use client";

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import ChildEnrollCard from "../../auth/components/ChildEnrollCard.jsx";
import { useAuthText } from "../../auth/config/authText.js";
import { FormDialog } from "../../../shared/components/index.js";
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
  const [child, setChild] = useState(emptyChild);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

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

  // Fetch the public plans whenever the dialog opens (the form itself is reset
  // on close, so each open starts clean without a setState-in-effect).
  useEffect(() => {
    if (open) plansReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plansReq.data || [];

  const patch = (p) => setChild((prev) => ({ ...prev, ...p }));

  function validate() {
    const e = {};
    if (!child.name.trim()) e.name = authTxt.required;
    if (!EMAIL_RE.test(child.email.trim())) e.email = authTxt.invalidEmail;
    if ((child.password || "").length < 6) e.password = authTxt.passwordShort;
    if (!child.planId) e.planId = authTxt.planRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function reset() {
    setChild(emptyChild());
    setErrors({});
    setFormError(null);
  }

  function handleClose() {
    if (loading) return;
    reset();
    onClose();
  }

  async function submit() {
    setFormError(null);
    if (!validate()) {
      setFormError(authTxt.fixErrors);
      return;
    }

    const plan = plans.find((p) => p.id === child.planId) || null;
    const { codeToSend } = resolveCoupon(plan, child.billingPeriod, child.coupon);

    let res;
    try {
      res = await createChildMut.postRequest(null, {
        name: child.name.trim(),
        email: child.email.trim(),
        password: child.password,
        nickname: child.nickname.trim() || undefined,
        birthDate: child.birthDate || undefined,
      });
    } catch {
      // creation failed (e.g. email taken) — toast already shown; keep the dialog
      return;
    }

    const childId = res?.data?.id;
    if (!childId) return;

    try {
      await requestMut.postRequest(null, {
        studentId: childId,
        planId: child.planId,
        billingPeriod: child.billingPeriod,
        ...(codeToSend ? { couponCode: codeToSend } : {}),
      });
    } catch {
      // child created but the subscription request failed — toast shown; still
      // refresh + close so the new child appears (parent can request a plan again)
    }

    onCreated?.();
    reset();
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
      onSubmit={submit}
    >
      <ChildEnrollCard
        index={0}
        child={child}
        plans={plans}
        onChange={patch}
        canRemove={false}
        errors={errors}
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
