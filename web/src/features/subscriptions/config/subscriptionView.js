import { SUBSCRIPTION_ORIGINS } from "@ayah/shared";

// (origin, status) → a unified visual "view" used by every subscription surface
// (list chip, detail chip, parent cards). A USAGE subscription that is still
// UPCOMING is the open, live-accumulating next-month bill (`isOpen`). Every other
// (origin, status) pair maps to the SAME color the app has always used per status
// (see STATUS_COLOR) so MANUAL subscriptions render exactly as before.
//
// phase: accumulating | awaitingPayment | upcoming | active | ended
//   - USAGE reads its phase label from `txt.phase[...]` (origin-aware wording,
//     e.g. PENDING = "Awaiting payment" for a frozen usage bill).
//   - MANUAL keeps its per-status label (`txt[status]`) — the chip prefers that.
const STATUS_PHASE = {
  PENDING: "awaitingPayment",
  UPCOMING: "upcoming",
  ACTIVE: "active",
  EXPIRED: "ended",
  CANCELLED: "ended",
};

const STATUS_COLOR = {
  PENDING: "warning",
  UPCOMING: "info",
  ACTIVE: "success",
  EXPIRED: "default",
  CANCELLED: "error",
};

export function resolveSubscriptionView(sub) {
  const isUsage = sub?.origin === SUBSCRIPTION_ORIGINS.USAGE;
  const status = sub?.status;

  // The open, live accumulating next-month usage bill.
  if (isUsage && status === "UPCOMING") {
    return { kind: "usage", phase: "accumulating", color: "info", isOpen: true };
  }

  return {
    kind: isUsage ? "usage" : "manual",
    phase: STATUS_PHASE[status] ?? "ended",
    color: STATUS_COLOR[status] ?? "default",
    isOpen: false,
  };
}
