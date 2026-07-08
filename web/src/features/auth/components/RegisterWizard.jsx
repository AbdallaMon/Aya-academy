"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Container, Stack, Typography, alpha } from "@mui/material";
import WizardStepper from "./WizardStepper.jsx";
import ChildrenStep from "./ChildrenStep.jsx";
import ReviewStep from "./ReviewStep.jsx";
import { useAuthText } from "../config/authText.js";
import { ENROLL_URL, PLANS_PUBLIC_URL } from "../config/constant.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { matchIsValidTel } from "mui-tel-input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyChild(planId = null, billingPeriod = "MONTHLY") {
  return {
    name: "",
    email: "",
    password: "",
    nickname: "",
    birthDate: "",
    billingPeriod,
    planId,
    coupon: { code: "", status: "idle", reason: null, quote: null },
  };
}

export default function RegisterWizard() {
  const txt = useAuthText();
  const router = useRouter();
  const { lng } = useTranslation();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  // Pre-select the plan/cycle when arriving from a home-page plan card
  // (/register?planId=…&billingPeriod=…).
  const [children, setChildren] = useState(() => {
    const planId = Number(searchParams.get("planId")) || null;
    // MONTHLY-only in the UI for now — ignore any ?billingPeriod=YEARLY.
    return [emptyChild(planId, "MONTHLY")];
  });
  const [parent, setParent] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [childErrors, setChildErrors] = useState([]);
  const [parentErrors, setParentErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const plansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    plansReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plans = plansReq.data || [];

  const enrollReq = useRequest({
    url: ENROLL_URL,
    method: "post",
    isPublic: true,
    shouldAutoToast: true,
    onSuccess: () => router.replace(localePath(lng, "/login")),
  });

  const patchChild = (index, patch) =>
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );

  const addChild = () => setChildren((prev) => [...prev, emptyChild()]);
  const removeChild = (index) =>
    setChildren((prev) => prev.filter((_, i) => i !== index));

  const patchParent = (patch) => setParent((prev) => ({ ...prev, ...patch }));

  const validateChildren = () => {
    const errs = children.map((c) => {
      const e = {};
      if (!c.name.trim()) e.name = txt.required;
      if (!EMAIL_RE.test(c.email.trim())) e.email = txt.invalidEmail;
      if ((c.password || "").length < 6) e.password = txt.passwordShort;
      if (!c.planId) e.planId = txt.planRequired;
      return e;
    });
    setChildErrors(errs);
    return errs.every((e) => Object.keys(e).length === 0);
  };

  const validateParent = () => {
    const e = {};
    if (!parent.name.trim()) e.name = txt.required;
    if (!EMAIL_RE.test(parent.email.trim())) e.email = txt.invalidEmail;
    if ((parent.password || "").length < 6) e.password = txt.passwordShort;
    if (!parent.phone.trim()) e.phone = txt.required;
    else if (!matchIsValidTel(parent.phone)) e.phone = txt.invalidPhone;
    setParentErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    setFormError(null);
    if (validateChildren()) setStep(1);
    else setFormError(txt.fixErrors);
  };

  const goBack = () => {
    setFormError(null);
    setStep(0);
  };

  const submit = async () => {
    setFormError(null);
    if (!validateParent()) {
      setFormError(txt.fixErrors);
      return;
    }
    const payload = {
      parent: {
        name: parent.name.trim(),
        email: parent.email.trim(),
        password: parent.password,
        phone: parent.phone.trim(),
        locale: lng === "en" ? "en" : "ar",
      },
      children: children.map((c) => {
        const plan = plans.find((p) => p.id === c.planId) || null;
        const { codeToSend } = resolveCoupon(plan, c.billingPeriod, c.coupon);
        return {
          name: c.name.trim(),
          email: c.email.trim(),
          password: c.password,
          nickname: c.nickname.trim() || undefined,
          birthDate: c.birthDate || undefined,
          planId: c.planId,
          billingPeriod: c.billingPeriod,
          couponCode: codeToSend,
        };
      }),
    };
    try {
      await enrollReq.fetchData(null, payload);
    } catch {
      // toast already shown by useRequest (shouldAutoToast)
    }
  };

  const steps = [txt.stepChildren, txt.stepReview];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 7 },
        background: (th) =>
          `radial-gradient(1100px 480px at 50% -8%, ${alpha(
            th.palette.primary.main,
            0.16,
          )} 0%, transparent 60%), linear-gradient(180deg, ${alpha(
            th.palette.secondary.main,
            0.06,
          )} 0%, ${th.palette.background.default} 40%)`,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
          <Box
            component={Link}
            href={localePath(lng, "/")}
            aria-label="Aya Academy"
            sx={{
              display: "inline-flex",
              p: 1.5,
              borderRadius: "50%",
              bgcolor: "background.paper",
              boxShadow: (th) => `0 10px 30px ${alpha(th.palette.primary.main, 0.18)}`,
            }}
          >
            <Box
              component="img"
              src="/logos/logo.png"
              alt="Aya Academy"
              sx={{ height: 64, display: "block" }}
            />
          </Box>
          <Typography variant="h4" fontWeight={900} textAlign="center">
            {txt.wizardTitle}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ maxWidth: 460 }}
          >
            {txt.wizardSubtitle}
          </Typography>
        </Stack>

        {/* ── Modern segmented progress ──────────────────────────────────── */}
        <WizardStepper steps={steps} step={step} />

        {step === 0 && (
          <ChildrenStep
            childrenList={children}
            plans={plans}
            childErrors={childErrors}
            patchChild={patchChild}
            removeChild={removeChild}
            addChild={addChild}
            formError={formError}
            goNext={goNext}
            txt={txt}
            lng={lng}
          />
        )}

        {step === 1 && (
          <ReviewStep
            childrenList={children}
            plans={plans}
            parent={parent}
            parentErrors={parentErrors}
            patchParent={patchParent}
            formError={formError}
            goBack={goBack}
            submit={submit}
            isSubmitting={enrollReq.isLoading}
            txt={txt}
            lng={lng}
          />
        )}

        <Stack spacing={1} alignItems="center" sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {txt.haveAccount}{" "}
            <Box
              component={Link}
              href={localePath(lng, "/login")}
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              {txt.goLogin}
            </Box>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
