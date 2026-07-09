"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { MdOpenInNew } from "react-icons/md";
import SubscriptionStatusChip from "../../../shared/components/SubscriptionStatusChip.jsx";
import { localePath } from "../../../i18n/routing.js";
import { formatMoney, formatHours } from "../../../shared/lib/money.js";
import { useSubscriptionDetailText } from "../../subscriptionDetail/config/subscriptionDetailText.js";
import SubscriptionActions from "../../subscriptionDetail/components/SubscriptionActions.jsx";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/**
 * One combined card per student: the CURRENT (being-paid) subscription and the
 * NEXT (open, accumulating USAGE) bill shown side by side. Both `current` and
 * `next` may be null — a student may have only one, or neither.
 *
 * Hours/price are read straight off the stored subscription (v2 stored model):
 * `sub.subsHours` / `sub.priceCharged` — no usage-preview fetch. The next bill's
 * hours grow as sessions are logged (the backend recomputes + stores them).
 *
 * @param {object}   props
 * @param {number}   props.studentId
 * @param {object=}  props.current      active subscription row or null
 * @param {object=}  props.next         open UPCOMING USAGE subscription row or null
 * @param {object}   props.txt          useSubscriptionsText() result
 * @param {string}   props.lng          active locale
 * @param {Function=} props.onChanged   refetch callback fired after an action
 * @param {boolean=} props.showActions  render the per-sub action bar (default true)
 * @param {boolean=} props.detailed     surface origin chip + period dates (default false)
 * @param {boolean=} props.hideHeader   hide the student-name header (default false)
 */
export default function SubscriptionSummaryCard({
  studentId,
  current,
  next,
  txt,
  lng,
  onChanged,
  showActions = true,
  detailed = false,
  hideHeader = false,
}) {
  // The embedded action bar (SubscriptionActions) speaks the subscription-DETAIL
  // text namespace, not this card's list-text — resolve it here so callers keep
  // passing the list `txt` for the card's own labels.
  const actionsTxt = useSubscriptionDetailText();
  const student = current?.student || next?.student || null;
  const studentLabel =
    student?.name || student?.nickname || `#${studentId ?? student?.id ?? ""}`;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .2s ease, transform .2s ease",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Header: student → their detail page */}
        {!hideHeader && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
            spacing={1}
          >
            {student?.id ? (
              <MuiLink
                component={Link}
                href={localePath(lng, `/dashboard/users/${student.id}`)}
                underline="hover"
                fontWeight={800}
                noWrap
                sx={{ minWidth: 0 }}
              >
                {studentLabel}
              </MuiLink>
            ) : (
              <Typography fontWeight={800} noWrap>
                {studentLabel}
              </Typography>
            )}
            <MuiLink
              component={Link}
              href={localePath(
                lng,
                `/dashboard/subscriptions?studentId=${studentId ?? student?.id}`,
              )}
              underline="hover"
              variant="caption"
              sx={{ whiteSpace: "nowrap" }}
            >
              {txt.viewAll}
            </MuiLink>
          </Stack>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <SubSlot
            title={txt.currentTitle}
            sub={current}
            emptyLabel={txt.noCurrent}
            txt={txt}
            actionsTxt={actionsTxt}
            lng={lng}
            variant="current"
            showActions={showActions}
            detailed={detailed}
            onChanged={onChanged}
          />
          <SubSlot
            title={txt.accumulatingTitle}
            sub={next}
            emptyLabel={txt.noNext}
            txt={txt}
            actionsTxt={actionsTxt}
            lng={lng}
            variant="next"
            showActions={showActions}
            detailed={detailed}
            onChanged={onChanged}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/** One column of the combined card — current or next. */
function SubSlot({
  title,
  sub,
  emptyLabel,
  txt,
  actionsTxt,
  lng,
  variant,
  showActions,
  detailed,
  onChanged,
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="overline"
        color={variant === "next" ? "info.main" : "text.secondary"}
        sx={{ display: "block", lineHeight: 1.4 }}
      >
        {title}
      </Typography>

      {!sub ? (
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          {emptyLabel}
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <Box>
            <SubscriptionStatusChip sub={sub} txt={txt} />
          </Box>

          {detailed ? (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                variant="outlined"
                label={sub.origin === "USAGE" ? txt.originUsage : txt.originManual}
                sx={{ height: 20, fontSize: "0.68rem" }}
              />
              {(sub.startDate || sub.endDate) && (
                <Typography variant="caption" color="text.secondary">
                  {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                </Typography>
              )}
            </Stack>
          ) : null}

          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="h5" fontWeight={800}>
              {formatHours(sub.subsHours)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {txt.hours}
            </Typography>
          </Stack>

          <Typography variant="body2" fontWeight={700}>
            {formatMoney(sub.priceCharged, sub.currency)}
          </Typography>

          {/* Current: invoice paid/unpaid hint. Next: "updates every session". */}
          {variant === "current" && sub.invoice ? (
            <Chip
              size="small"
              variant="outlined"
              color={sub.invoice.status === "PAID" ? "success" : "warning"}
              label={sub.invoice.status === "PAID" ? txt.paid : txt.unpaid}
              sx={{ alignSelf: "flex-start", height: 20, fontSize: "0.68rem" }}
            />
          ) : null}
          {variant === "next" ? (
            <Typography variant="caption" color="text.secondary">
              {txt.liveHint}
            </Typography>
          ) : null}

          <MuiLink
            component={Link}
            href={localePath(lng, `/dashboard/subscriptions/${sub.id}`)}
            underline="hover"
            variant="caption"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
          >
            {txt.view}
            <MdOpenInNew size={13} />
          </MuiLink>

          {showActions ? (
            <Box sx={{ mt: 0.5 }}>
              <SubscriptionActions
                subscription={sub}
                invoice={sub.invoice}
                txt={actionsTxt}
                onChanged={onChanged}
              />
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
