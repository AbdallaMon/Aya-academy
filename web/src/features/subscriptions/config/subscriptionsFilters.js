// Declarative filter-bar config for the subscriptions list (the config/ folder is
// the contract — no inline filterConfig in the page).
//
// buildSubscriptionsFilters({ txt }) returns the status enum filter, whose option
// KEYS are the statuses the backend expects and VALUES are the localized labels.
import { SUBSCRIPTION_STATUSES } from "./constant.js";

export function buildSubscriptionsFilters({ txt }) {
  return [
    {
      type: "enum",
      key: "status",
      label: txt.status,
      options: SUBSCRIPTION_STATUSES.reduce(
        (acc, s) => ({ ...acc, [s]: txt[s] }),
        {},
      ),
    },
  ];
}
