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
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  MdPerson,
  MdEmojiEmotions,
  MdEmail,
  MdAlternateEmail,
  MdCake,
  MdChildCare,
  MdCardGiftcard,
  MdEventAvailable,
  MdDeleteOutline,
} from "react-icons/md";
import PlanRadioCards from "./PlanRadioCards.jsx";
import { PasswordField, CouponControl } from "../../../shared/components/index.js";
import { initialCoupon } from "../../../shared/lib/couponPricing.js";
import IdentityChoiceNotice from "./IdentityChoiceNotice.jsx";

/** Eyebrow + title for a sub-section inside the card, to give the long form rhythm. */
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

  // Selecting a plan resets the coupon to that plan's removable default
  // (its own coupon, if any) for the current (monthly) cycle.
  const handleSelectPlan = (planId) => {
    const plan = plans.find((p) => p.id === planId) || null;
    onChange({ planId, coupon: initialCoupon(plan, child.billingPeriod) });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: (th) => `0 8px 28px ${alpha(th.palette.primary.main, 0.07)}`,
      }}
    >
      {/* ── Vibrant identity header band ─────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          bgcolor: (th) => alpha(th.palette.primary.main, 0.07),
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "primary.main",
              bgcolor: (th) => alpha(th.palette.primary.main, 0.13),
            }}
          >
            <MdChildCare size={24} />
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            {canRemove && (
              <Typography
                variant="caption"
                fontWeight={800}
                color="primary.main"
              >
                {txt.childNumber} {index + 1}
              </Typography>
            )}
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              {child.name?.trim() || txt.childTitle}
            </Typography>
          </Box>
          {canRemove && (
            <Tooltip title={txt.removeChild}>
              <IconButton
                size="small"
                onClick={onRemove}
                sx={{
                  color: "error.main",
                  bgcolor: (th) => alpha(th.palette.error.main, 0.07),
                }}
              >
                <MdDeleteOutline />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* ── 1. Student details ─────────────────────────────────────────── */}
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
          <Grid size={{ xs: 12 }}>
            <IdentityChoiceNotice txt={txt} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.emailOptional}
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
            <TextField
              label={txt.usernameOptional}
              value={child.username}
              onChange={setField("username")}
              error={Boolean(errors.username)}
              helperText={errors.username || txt.usernameFormatHint}
              fullWidth
              size="small"
              slotProps={adorn(<MdAlternateEmail size={18} />)}
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
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
            {txt.choosePlan}
          </Typography>

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
