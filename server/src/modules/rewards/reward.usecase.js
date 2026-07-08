import {
  REWARD_STATUSES,
  REWARD_TYPES,
  USER_ROLES,
  messagesNames,
  rewardMessagesCodes,
} from "@aya/shared";
import { conflict, forbidden, notFound } from "../../shared/errors/AppError.js";
import { assertActiveForStudent } from "../../shared/access/subscriptionAccess.js";
import { userRepo } from "../users/user.repo.js";
import { rewardRepo } from "./reward.repo.js";

class RewardUsecase {
  async assertCanAccess(authUser, userId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    const isSelfStudent = userId === authUser.id && authUser.role === USER_ROLES.STUDENT;
    const isLinkedChild =
      authUser.role === USER_ROLES.PARENT &&
      userId &&
      (await userRepo.isStudentOfParent(authUser.id, userId));
    if (isSelfStudent || isLinkedChild) {
      // Achievements are hidden when the student's subscription is not active.
      await assertActiveForStudent(userId);
      return;
    }
    if (userId === authUser.id) return; // parent's own (non-student) rewards, if any
    throw forbidden(rewardMessagesCodes.CANNOT_ACCESS_REWARD);
  }

  async list({ page, limit, filters = {}, authUser }) {
    // Where-building now lives in the repo (reference convention).
    const where = await rewardRepo.buildListWhere(authUser, filters);
    return rewardRepo.list({ page, limit, where });
  }

  async getById({ id, authUser }) {
    const reward = await rewardRepo.getById({ id });
    if (!reward) throw notFound(rewardMessagesCodes.REWARD_NOT_FOUND);
    await this.assertCanAccess(authUser, reward.userId);
    return reward;
  }

  async claim({ id, authUser }) {
    const reward = await rewardRepo.getById({ id });
    if (!reward) throw notFound(rewardMessagesCodes.REWARD_NOT_FOUND);
    await this.assertCanAccess(authUser, reward.userId);
    if (reward.status === REWARD_STATUSES.CLAIMED) {
      throw conflict(
        rewardMessagesCodes.REWARD_ALREADY_CLAIMED,
        messagesNames.rewardMessages,
      );
    }
    return rewardRepo.markClaimed({ id });
  }

  // ── reusable services (importable by games / quizzes) ──────────
  /** Grant a coupon reward (discount gift). */
  grantCoupon({ userId, couponId, sourceType, sourceId }, tx) {
    return rewardRepo.create({
      data: {
        type: REWARD_TYPES.COUPON,
        status: REWARD_STATUSES.PENDING,
        userId,
        couponId,
        sourceType,
        sourceId,
      },
      client: tx,
    });
  }

  /** Grant free lectures. */
  grantFreeLectures({ userId, count, sourceType, sourceId }, tx) {
    return rewardRepo.create({
      data: {
        type: REWARD_TYPES.FREE_LECTURES,
        status: REWARD_STATUSES.PENDING,
        userId,
        freeLectureCount: count,
        sourceType,
        sourceId,
      },
      client: tx,
    });
  }

  /** Grant a symbolic badge/sticker gift (e.g. a parent-built quiz gift). */
  grantBadge({ userId, sourceType, sourceId }, tx) {
    return rewardRepo.create({
      data: {
        type: REWARD_TYPES.BADGE,
        status: REWARD_STATUSES.PENDING,
        userId,
        sourceType,
        sourceId,
      },
      client: tx,
    });
  }
}

export const rewardUsecase = new RewardUsecase();
export { RewardUsecase };
