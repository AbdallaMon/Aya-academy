"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { MdArrowForward } from "react-icons/md";
import { matchIsValidTel } from "mui-tel-input";
import WizardStepper from "./WizardStepper.jsx";
import ParentStep from "./ParentStep.jsx";
import ChildrenStep from "./ChildrenStep.jsx";
import ReviewStep from "./ReviewStep.jsx";
import { useAuthText } from "../config/authText.js";
import { ENROLL_URL, PLANS_PUBLIC_URL } from "../config/constant.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { resolveCoupon } from "../../../shared/lib/couponPricing.js";
import {
  buildIdentityPayload,
  validateOptionalIdentity,
} from "../../../shared/lib/userIdentity.js";

function emptyChild(planId = null, billingPeriod = "MONTHLY") {
  return {
    name: "",
    email: "",
    username: "",
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
  const [children, setChildren] = useState(() => {
    const planId = Number(searchParams.get("planId")) || null;
    return [emptyChild(planId, "MONTHLY")];
  });
  const [parent, setParent] = useState({
    name: "",
    email: "",
    username: "",
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
    setChildren((previous) =>
      previous.map((child, i) =>
        i === index ? { ...child, ...patch } : child,
      ),
    );

  const addChild = () => setChildren((previous) => [...previous, emptyChild()]);
  const removeChild = (index) =>
    setChildren((previous) => previous.filter((_, i) => i !== index));
  const patchParent = (patch) =>
    setParent((previous) => ({ ...previous, ...patch }));

  const validateChildren = () => {
    const errors = children.map((child) => {
      const childError = validateOptionalIdentity(child, {
        requiredMessage: txt.identityRequired,
        invalidEmailMessage: txt.invalidEmail,
        invalidUsernameMessage: txt.invalidUsername,
      });
      if (!child.name.trim()) childError.name = txt.required;
      if ((child.password || "").length < 6) {
        childError.password = txt.passwordShort;
      }
      if (!child.planId) childError.planId = txt.planRequired;
      return childError;
    });
    setChildErrors(errors);
    return errors.every((error) => Object.keys(error).length === 0);
  };

  const validateParent = () => {
    const errors = validateOptionalIdentity(parent, {
      requiredMessage: txt.identityRequired,
      invalidEmailMessage: txt.invalidEmail,
      invalidUsernameMessage: txt.invalidUsername,
    });
    if (!parent.name.trim()) errors.name = txt.required;
    if ((parent.password || "").length < 6) {
      errors.password = txt.passwordShort;
    }
    if (!parent.phone.trim()) errors.phone = txt.required;
    else if (!matchIsValidTel(parent.phone)) errors.phone = txt.invalidPhone;
    setParentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  function moveToStep(nextStep) {
    setFormError(null);
    setStep(nextStep);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goFromParent() {
    setFormError(null);
    if (validateParent()) moveToStep(1);
    else setFormError(txt.fixErrors);
  }

  function goFromChildren() {
    setFormError(null);
    if (validateChildren()) moveToStep(2);
    else setFormError(txt.fixErrors);
  }

  const submit = async () => {
    setFormError(null);
    if (!validateParent()) {
      moveToStep(0);
      setFormError(txt.fixErrors);
      return;
    }
    if (!validateChildren()) {
      moveToStep(1);
      setFormError(txt.fixErrors);
      return;
    }

    const payload = {
      parent: {
        name: parent.name.trim(),
        ...buildIdentityPayload(parent),
        password: parent.password,
        phone: parent.phone.trim(),
        locale: lng === "en" ? "en" : "ar",
      },
      children: children.map((child) => {
        const plan = plans.find((item) => item.id === child.planId) || null;
        const resolved = resolveCoupon(
          plan,
          child.billingPeriod,
          child.coupon,
        );
        return {
          name: child.name.trim(),
          ...buildIdentityPayload(child),
          password: child.password,
          nickname: child.nickname.trim() || undefined,
          birthDate: child.birthDate || undefined,
          planId: child.planId,
          billingPeriod: child.billingPeriod,
          couponCode:
            resolved.applied === "custom"
              ? resolved.codeToSend
              : undefined,
          applyPlanCoupon: resolved.applyPlanCoupon,
        };
      }),
    };

    try {
      await enrollReq.fetchData(null, payload);
    } catch {
      // The localized request toast already explains the failure.
    }
  };

  const steps = [txt.stepParent, txt.stepChildren, txt.stepReview];
  const stepContent = [
    {
      title: txt.parentStepTitle,
      description: txt.parentStepSubtitle,
    },
    {
      title: txt.childrenStepTitle,
      description: txt.childrenStepSubtitle,
    },
    {
      title: txt.reviewStepTitle,
      description: txt.reviewStepSubtitle,
    },
  ];
  const current = stepContent[step];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          `radial-gradient(circle at 8% 8%, ${alpha(
            theme.palette.primary.main,
            0.08,
          )}, transparent 30%)`,
      }}
    >
      <Box
        component="header"
        sx={{
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.94),
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 64 }}
          >
            <Stack
              component={Link}
              href={localePath(lng, "/")}
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ color: "text.primary", textDecoration: "none" }}
            >
              <Box
                component="img"
                src="/logos/logo.png"
                alt={txt.appName}
                sx={{ width: 40, height: 40, objectFit: "contain" }}
              />
              <Typography variant="subtitle1" fontWeight={900}>
                {txt.appName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {txt.haveAccount}
              </Typography>
              <Button
                component={Link}
                href={localePath(lng, "/login")}
                variant="outlined"
                size="small"
                endIcon={<MdArrowForward />}
              >
                {txt.goLogin}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3.5, md: 4 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 4, lg: 3.25 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1, md: 2.5 },
                borderRadius: 3.5,
                position: { md: "sticky" },
                top: { md: 24 },
              }}
            >
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Typography
                  variant="overline"
                  color="primary.main"
                  fontWeight={900}
                >
                  {txt.registrationEyebrow}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{ mt: 0.25, mb: 0.75 }}
                >
                  {txt.wizardTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {txt.wizardSubtitle}
                </Typography>

                <Divider sx={{ my: 2 }} />
              </Box>
              <WizardStepper steps={steps} step={step} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8, lg: 8.75 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3, md: 3.5 },
                borderRadius: 3.5,
                boxShadow: (theme) =>
                  `0 18px 50px ${alpha(theme.palette.primary.main, 0.07)}`,
              }}
            >
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={900}
              >
                {txt.stepCounter
                  .replace("{current}", String(step + 1))
                  .replace("{total}", String(steps.length))}
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ mt: 0.25 }}>
                {current.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {current.description}
              </Typography>
              <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />

              {step === 0 && (
                <ParentStep
                  parent={parent}
                  parentErrors={parentErrors}
                  patchParent={patchParent}
                  formError={formError}
                  goNext={goFromParent}
                  txt={txt}
                />
              )}

              {step === 1 && (
                <ChildrenStep
                  childrenList={children}
                  plans={plans}
                  childErrors={childErrors}
                  patchChild={patchChild}
                  removeChild={removeChild}
                  addChild={addChild}
                  formError={formError}
                  goBack={() => moveToStep(0)}
                  goNext={goFromChildren}
                  txt={txt}
                  lng={lng}
                />
              )}

              {step === 2 && (
                <ReviewStep
                  childrenList={children}
                  plans={plans}
                  parent={parent}
                  formError={formError}
                  goBack={() => moveToStep(1)}
                  onEditParent={() => moveToStep(0)}
                  submit={submit}
                  isSubmitting={enrollReq.isLoading}
                  txt={txt}
                  lng={lng}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
