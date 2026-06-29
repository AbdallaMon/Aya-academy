"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  MdPerson,
  MdEmojiEmotions,
  MdEmail,
  MdCake,
  MdChildCare,
  MdCardGiftcard,
  MdEventAvailable,
  MdDeleteOutline,
} from "react-icons/md";
import PlanRadioCards from "./PlanRadioCards.jsx";
import { PasswordField, CouponControl } from "../../../shared/components/index.js";
import { initialCoupon } from "../../../shared/lib/couponPricing.js";

/** Eyebrow + title for a sub-section inside the card, to give the long form rhythm. */
function SectionHeader({ step, title }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "primary.contrastText",
          background: (th) =>
            `linear-gradient(135deg, ${th.palette.primary.main}, ${th.palette.primary.dark})`,
          boxShadow: (th) => `0 4px 10px ${alpha(th.palette.primary.main, 0.35)}`,
        }}
      >
        <Typography component="span" fontWeight={900} fontSize={15}>
          {step}
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight={800}>
        {title}
      </Typography>
    </Stack>
  );
}

/** One benefit line in the reassurance strip (gift / no-payment). */
function Benefit({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: "success.main", display: "flex", flexShrink: 0 }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "text.primary" }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function ChildEnrollCard({
  index,
  child,
  plans,
  onChange,
  onRemove,
  canRemove,
  errors = {},
  txt,
  lng,
}) {
  const selectedPlan = plans.find((p) => p.id === child.planId) || null;

  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  const adorn = (icon) => ({
    input: {
      startAdornment: (
        <InputAdornment position="start" sx={{ color: "text.disabled" }}>
          {icon}
        </InputAdornment>
      ),
    },
  });

  // Selecting a plan / switching the cycle resets the coupon to that plan's
  // removable default (its own coupon, if any) for the new context.
  const handleBilling = (_e, value) => {
    if (!value) return;
    onChange({ billingPeriod: value, coupon: initialCoupon(selectedPlan, value) });
  };

  const handleSelectPlan = (planId) => {
    const plan = plans.find((p) => p.id === planId) || null;
    onChange({ planId, coupon: initialCoupon(plan, child.billingPeriod) });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: (th) => `0 18px 40px ${alpha(th.palette.primary.main, 0.12)}`,
      }}
    >
      {/* ── Vibrant identity header band ─────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          px: { xs: 2.5, md: 3.5 },
          py: 2.5,
          color: "primary.contrastText",
          background: (th) =>
            `linear-gradient(120deg, ${th.palette.primary.dark} 0%, ${th.palette.primary.main} 60%, ${th.palette.secondary.main} 140%)`,
        }}
      >
        {/* decorative bubbles */}
        <Box
          sx={{
            position: "absolute",
            insetInlineEnd: -30,
            top: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            bgcolor: alpha("#fff", 0.12),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            insetInlineEnd: 60,
            bottom: -45,
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: alpha("#fff", 0.08),
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.75}
          sx={{ position: "relative" }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: alpha("#fff", 0.22),
              border: `2px solid ${alpha("#fff", 0.5)}`,
            }}
          >
            <MdChildCare size={30} />
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            {canRemove && (
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ opacity: 0.85, letterSpacing: "0.05em" }}
              >
                {txt.childNumber} {index + 1}
              </Typography>
            )}
            <Typography variant="h6" fontWeight={800} noWrap sx={{ color: "inherit" }}>
              {child.name?.trim() || txt.childTitle}
            </Typography>
          </Box>
          {canRemove && (
            <Tooltip title={txt.removeChild}>
              <IconButton
                size="small"
                onClick={onRemove}
                sx={{
                  color: "#fff",
                  bgcolor: alpha("#fff", 0.15),
                  "&:hover": { bgcolor: alpha("#fff", 0.28) },
                }}
              >
                <MdDeleteOutline />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        {/* ── 1. Student details ─────────────────────────────────────────── */}
        <SectionHeader step="1" title={txt.childTitle} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.childName}
              value={child.name}
              onChange={setField("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              size="small"
              slotProps={adorn(<MdPerson size={18} />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.nickname}
              value={child.nickname}
              onChange={setField("nickname")}
              fullWidth
              size="small"
              slotProps={adorn(<MdEmojiEmotions size={18} />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.email}
              type="email"
              value={child.email}
              onChange={setField("email")}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              size="small"
              slotProps={adorn(<MdEmail size={18} />)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordField
              label={txt.password}
              value={child.password}
              onChange={setField("password")}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.birthDate}
              type="date"
              value={child.birthDate}
              onChange={setField("birthDate")}
              fullWidth
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: "text.disabled" }}>
                      <MdCake size={18} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>

        {/* ── Reassurance strip: gift + no-payment, one calm tinted block ──── */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: (th) => alpha(th.palette.success.main, 0.08),
            border: 1,
            borderColor: (th) => alpha(th.palette.success.main, 0.25),
          }}
        >
          <Stack spacing={1}>
            <Benefit icon={<MdCardGiftcard size={20} />}>{txt.giftBanner}</Benefit>
            <Benefit icon={<MdEventAvailable size={20} />}>{txt.paymentNotice}</Benefit>
          </Stack>
        </Box>

        {/* ── 2. Choose a plan ───────────────────────────────────────────── */}
        <Box sx={{ mt: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <SectionHeader step="2" title={txt.choosePlan} />
            <ToggleButtonGroup
              value={child.billingPeriod}
              exclusive
              color="primary"
              size="small"
              onChange={handleBilling}
              sx={{ alignSelf: { xs: "center", sm: "auto" } }}
            >
              <ToggleButton value="MONTHLY" sx={{ px: 2 }}>
                {txt.monthly}
              </ToggleButton>
              <ToggleButton value="YEARLY" sx={{ px: 2 }}>
                {txt.yearly}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <PlanRadioCards
            plans={plans}
            billingPeriod={child.billingPeriod}
            selectedPlanId={child.planId}
            onSelect={handleSelectPlan}
            lng={lng}
            txt={txt}
          />
          {errors.planId && (
            <Typography
              color="error"
              variant="caption"
              sx={{ mt: 1, display: "block" }}
            >
              {errors.planId}
            </Typography>
          )}

          {child.planId && (
            <Box sx={{ mt: 2 }}>
              <CouponControl
                plan={selectedPlan}
                billingPeriod={child.billingPeriod}
                coupon={child.coupon}
                onCoupon={(c) => onChange({ coupon: c })}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
