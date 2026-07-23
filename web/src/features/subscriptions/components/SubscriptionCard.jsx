"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { MdOpenInNew } from "react-icons/md";
import SubscriptionStatusChip from "../../../shared/components/SubscriptionStatusChip.jsx";
import { localePath } from "../../../i18n/routing.js";
import { formatDurationMinutes } from "../../../shared/lib/money.js";
import { useSubscriptionDetailText } from "../../subscriptionDetail/config/subscriptionDetailText.js";
import SubscriptionActions from "../../subscriptionDetail/components/SubscriptionActions.jsx";
import SubscriptionPriceBreakdown from "./SubscriptionPriceBreakdown.jsx";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/**
 * ONE subscription rendered as a card — the cards-only replacement for the
 * subscriptions list table. Shows the status chip, invoice hours, price charged,
 * the billing period, the origin (usage/manual) chip and — for the current sub —
 * the invoice paid/unpaid hint. The card header carries the compact ⋮ overflow
 * menu (SubscriptionActions "menu" variant) so every state-permitted action
 * (edit-hours / renew / activate / cancel / coupon / send / mark-paid) is
 * reachable per card, exactly as in SubscriptionSummaryCard's SubSlot.
 *
 * The action menu speaks the subscription-DETAIL text namespace, resolved here,
 * so callers keep passing the list `txt` for the card's own labels.
 *
 * @param {object}    props
 * @param {object}    props.sub        the raw subscription row
 * @param {object}    props.txt        useSubscriptionsText() result (card labels)
 * @param {string}    props.lng        active locale
 * @param {Function=} props.onChanged  refetch callback fired after an action
 */
export default function SubscriptionCard({ sub, txt, lng, onChanged }) {
  const detailTxt = useSubscriptionDetailText();
  if (!sub) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        transition: "box-shadow .2s ease, transform .2s ease",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
    >
      <CardContent
        sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}
      >
        {/* Header: status chip + the compact ⋮ menu */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ minHeight: 32 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <SubscriptionStatusChip sub={sub} txt={txt} />
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <SubscriptionActions
              variant="menu"
              subscription={sub}
              invoice={sub.invoice}
              txt={detailTxt}
              onChanged={onChanged}
            />
          </Box>
        </Stack>

        {/* Origin + period */}
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

        {/* Duration */}
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h5" fontWeight={800}>
            {formatDurationMinutes(sub.subsMinutes, lng)}
          </Typography>
        </Stack>

        {/* Price */}
        <SubscriptionPriceBreakdown
          subscription={sub}
          invoice={sub.invoice}
          txt={txt}
        />

        {/* Invoice paid/unpaid hint */}
        {sub.invoice ? (
          <Chip
            size="small"
            variant="outlined"
            color={sub.invoice.status === "PAID" ? "success" : "warning"}
            label={sub.invoice.status === "PAID" ? txt.paid : txt.unpaid}
            sx={{ alignSelf: "flex-start", height: 20, fontSize: "0.68rem" }}
          />
        ) : null}

        <MuiLink
          component={Link}
          href={localePath(lng, `/dashboard/subscriptions/${sub.id}`)}
          underline="hover"
          variant="caption"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mt: "auto",
          }}
        >
          {txt.view}
          <MdOpenInNew size={13} />
        </MuiLink>
      </CardContent>
    </Card>
  );
}
