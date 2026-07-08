"use client";

import { Chip } from "@mui/material";
import { resolveSubscriptionView } from "../../features/subscriptions/config/subscriptionView.js";

/**
 * Shared status chip for a subscription row/record. USAGE subscriptions read an
 * origin-aware phase label (`txt.phase[...]`) — e.g. an accumulating next-month
 * bill or a frozen "Awaiting payment" one. MANUAL subscriptions keep their exact
 * per-status label (`txt[status]`) and color, so they render as they always have.
 *
 * `txt` must expose a `phase` map ({ accumulating, awaitingPayment, upcoming,
 * active, ended }); MANUAL surfaces additionally expose the per-status labels.
 */
export default function SubscriptionStatusChip({ sub, txt, size = "small", variant = "filled" }) {
  const view = resolveSubscriptionView(sub);
  const label =
    view.kind === "usage"
      ? txt?.phase?.[view.phase] ?? view.phase
      : txt?.[sub?.status] ?? txt?.phase?.[view.phase] ?? sub?.status;
  return <Chip size={size} variant={variant} color={view.color} label={label} />;
}
