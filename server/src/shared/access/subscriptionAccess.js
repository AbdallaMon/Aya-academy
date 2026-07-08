// server/src/shared/access/subscriptionAccess.js
// Subscription STATUS gate — the single place that answers "is this student
// currently subscribed?". Orthogonal to role permissions. Built on the existing
// activeSubscriptionWhere() (via subscriptionRepo) so "active" has one definition.
import { messagesNames, subscriptionMessagesCodes } from "@aya/shared";
import { AppError } from "../errors/AppError.js";
import { subscriptionRepo } from "../../modules/finance/subscriptions/subscription.repo.js";

/** True when the student has a currently-ACTIVE subscription. */
export async function hasActiveSubscription(studentId) {
  if (!studentId) return false;
  const ids = await subscriptionRepo.getCurrentlySubscribedStudentIds([studentId]);
  return ids.includes(studentId);
}

/** Throws 403 SUBSCRIPTION_INACTIVE unless the student is currently subscribed. */
export async function assertActiveForStudent(studentId) {
  if (await hasActiveSubscription(studentId)) return;
  throw new AppError({
    statusCode: 403,
    code: subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE,
    message: subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE,
    translationKey: messagesNames.subscriptionMessages,
    dontRedirect: true,
  });
}

/** Subset of `studentIds` that are currently subscribed. */
export async function filterActiveStudentIds(studentIds) {
  if (!studentIds?.length) return [];
  return subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds);
}
