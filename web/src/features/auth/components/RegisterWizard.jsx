"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import ChildEnrollCard from "./ChildEnrollCard.jsx";
import EnrollSummaryTable from "./EnrollSummaryTable.jsx";
import ParentDetailsForm from "./ParentDetailsForm.jsx";
import { useAuthText } from "../config/authText.js";
import { ENROLL_URL, PLANS_PUBLIC_URL } from "../config/constant.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { resolveCoupon } from "../../../shared/lib/couponPricing.js";

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
    const billingPeriod =
      searchParams.get("billingPeriod") === "YEARLY" ? "YEARLY" : "MONTHLY";
    return [emptyChild(planId, billingPeriod)];
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

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box
            component={Link}
            href={localePath(lng, "/")}
            aria-label="Aya Academy"
          >
            <Box
              component="img"
              src="/logos/logo.png"
              alt="Aya Academy"
              sx={{ height: 56 }}
            />
          </Box>
          <Typography variant="h4" fontWeight={800} textAlign="center">
            {txt.wizardTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {txt.wizardSubtitle}
          </Typography>
        </Stack>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          <Step>
            <StepLabel>{txt.stepChildren}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{txt.stepReview}</StepLabel>
          </Step>
        </Stepper>

        {step === 0 && (
          <Stack spacing={3}>
            {children.map((child, i) => (
              <ChildEnrollCard
                key={i}
                index={i}
                child={child}
                plans={plans}
                onChange={(patch) => patchChild(i, patch)}
                onRemove={() => removeChild(i)}
                canRemove={children.length > 1}
                errors={childErrors[i] || {}}
                txt={txt}
                lng={lng}
              />
            ))}
            <Button
              variant="outlined"
              onClick={addChild}
              sx={{ width: { xs: "100%", sm: "auto" }, alignSelf: "flex-start" }}
            >
              {txt.addChild}
            </Button>
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}
            <Box>
              <Button
                variant="contained"
                size="large"
                onClick={goNext}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {txt.next}
              </Button>
            </Box>
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={800}>
              {txt.summaryTitle}
            </Typography>
            <EnrollSummaryTable
              items={children}
              plans={plans}
              lng={lng}
              txt={txt}
            />

            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                {txt.parentTitle}
              </Typography>
              <ParentDetailsForm
                parent={parent}
                onChange={patchParent}
                errors={parentErrors}
                txt={txt}
              />
            </Paper>

            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}

            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={2}
            >
              <Button
                variant="text"
                onClick={goBack}
                disabled={enrollReq.isLoading}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {txt.back}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={submit}
                disabled={enrollReq.isLoading}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {enrollReq.isLoading ? txt.submitting : txt.submit}
              </Button>
            </Stack>
          </Stack>
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
