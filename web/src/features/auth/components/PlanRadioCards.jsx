"use client";

import { Box, Card, Chip, Stack, Typography, alpha } from "@mui/material";
import { MdCheckCircle, MdAccessTime } from "react-icons/md";
import { formatMoney } from "../../../shared/lib/money.js";

/** Plans as single-select (radio) cards for one billing cycle.
 *  Compact, mobile-first layout: 2-up grid on every breakpoint, each card
 *  shows only the essentials (title, hours, price). Featured plans get a
 *  primary-tinted treatment + "most popular" ribbon. */
export default function PlanRadioCards({
  plans,
  selectedPlanId,
  onSelect,
  lng,
  txt,
}) {
  if (!plans || plans.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {txt.noPlans}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: { xs: 1.25, sm: 2 },
      }}
    >
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
            : `-${formatMoney(discount.value, p.currency)}`);
        const selected = selectedPlanId === p.id;
        const featured = Boolean(p.isFeatured);

        return (
          <Card
            key={p.id}
            variant="outlined"
            onClick={() => onSelect(p.id)}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(p.id);
              }
            }}
            sx={{
              position: "relative",
              cursor: "pointer",
              borderRadius: 3,
              borderWidth: selected ? 2 : 1,
              borderColor: selected
                ? "primary.main"
                : featured
                  ? "primary.light"
                  : "divider",
              bgcolor: (th) =>
                featured ? alpha(th.palette.primary.main, 0.05) : "background.paper",
              boxShadow: selected
                ? (th) => `0 8px 24px ${alpha(th.palette.primary.main, 0.22)}`
                : 0,
              transition: "border-color .15s ease, box-shadow .15s ease",
              overflow: "hidden",
            }}
          >
            {/* Featured ribbon — top strip so it never competes with the price */}
            {featured && (
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  textAlign: "center",
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{ fontSize: { xs: 10, sm: 11 } }}
                >
                  {txt.featured}
                </Typography>
              </Box>
            )}

            {/* Selected check — corner marker */}
            {selected && (
              <Box
                sx={{
                  position: "absolute",
                  top: featured ? 28 : 8,
                  insetInlineEnd: 8,
                  color: "primary.main",
                  display: "flex",
                }}
              >
                <MdCheckCircle size={20} />
              </Box>
            )}

            <Stack spacing={1} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography
                fontWeight={800}
                sx={{
                  fontSize: { xs: 15, sm: 17 },
                  lineHeight: 1.25,
                  pe: selected ? 3 : 0,
                }}
              >
                {lng === "en" ? p.titleEn : p.titleAr}
              </Typography>

              {/* Hours — the plan's differentiator, kept as a light pill */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <MdAccessTime size={15} style={{ opacity: 0.6 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {p.hours} {txt.hours}
                </Typography>
              </Stack>

              {/* Price */}
              <Stack direction="row" alignItems="baseline" spacing={0.5} flexWrap="wrap">
                <Typography
                  fontWeight={900}
                  color="primary"
                  sx={{ fontSize: { xs: 20, sm: 26 } }}
                >
                  {formatMoney(hasDiscount ? effective : base, p.currency)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {txt.perMonth}
                </Typography>
              </Stack>

              {hasDiscount && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textDecoration: "line-through" }}
                  >
                    {formatMoney(base, p.currency)}
                  </Typography>
                  {discountLabel && (
                    <Chip
                      size="small"
                      color="error"
                      label={discountLabel}
                      sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
                    />
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );
      })}
    </Box>
  );
}
