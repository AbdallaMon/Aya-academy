import {
  REWARD_STATUSES,
  REWARD_TYPES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { conflict, forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { rewardRepo } from "./reward.repo.js";
import { rewardMessagesCodes } from "./reward.messages.js";

class RewardUsecase {
  async assertCanAccess(authUser, userId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (userId === authUser.id) return;
    if (authUser.role === USER_ROLES.PARENT) {
      if (userId && (await userRepo.isStudentOfParent(authUser.id, userId))) {
        return;
      }
    }
    throw forbidden(rewardMessagesCodes.CANNOT_ACCESS_REWARD);
  }

  async buildListWhere(authUser, { userId, status }) {
    const where = {};
    if (status) where.status = status;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (userId) where.userId = userId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const ids = await userRepo.getStudentIdsForParent(authUser.id);
      const scope = [...ids, authUser.id];
      where.userId =
        userId && scope.includes(userId) ? userId : { in: scope };
    } else {
      where.userId = authUser.id;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildListWhere(authUser, params);
    const { items, total } = await rewardRepo.list(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getById(authUser, id) {
    const reward = await rewardRepo.getById(id);
    if (!reward) throw notFound(rewardMessagesCodes.REWARD_NOT_FOUND);
    await this.assertCanAccess(authUser, reward.userId);
    return reward;
  }

  async claim(authUser, id) {
    const reward = await rewardRepo.getById(id);
    if (!reward) throw notFound(rewardMessagesCodes.REWARD_NOT_FOUND);
    await this.assertCanAccess(authUser, reward.userId);
    if (reward.status === REWARD_STATUSES.CLAIMED) {
      throw conflict(
        rewardMessagesCodes.REWARD_ALREADY_CLAIMED,
        messagesNames.rewardMessages,
      );
    }
    return rewardRepo.markClaimed(id);
  }

  // ── reusable services (importable by games / quizzes) ──────────
  /** Grant a coupon reward (discount gift). */
  grantCoupon({ userId, couponId, sourceType, sourceId }, tx) {
    return rewardRepo.create(
      {
        type: REWARD_TYPES.COUPON,
        status: REWARD_STATUSES.PENDING,
        userId,
        couponId,
        sourceType,
        sourceId,
      },
      tx,
    );
  }

  /** Grant free lectures. */
  grantFreeLectures({ userId, count, sourceType, sourceId }, tx) {
    return rewardRepo.create(
      {
        type: REWARD_TYPES.FREE_LECTURES,
        status: REWARD_STATUSES.PENDING,
        userId,
        freeLectureCount: count,
        sourceType,
        sourceId,
      },
      tx,
    );
  }

  /** Grant a symbolic badge/sticker gift (e.g. a parent-built quiz gift). */
  grantBadge({ userId, sourceType, sourceId }, tx) {
    return rewardRepo.create(
      {
        type: REWARD_TYPES.BADGE,
        status: REWARD_STATUSES.PENDING,
        userId,
        sourceType,
        sourceId,
      },
      tx,
    );
  }
}

export const rewardUsecase = new RewardUsecase();
