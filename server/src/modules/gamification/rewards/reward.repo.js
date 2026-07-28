import { prisma } from "@ayah/db/prisma.client.js";
import { USER_ROLES } from "@ayah/shared";
import { filterActiveStudentIds } from "../../../shared/access/subscriptionAccess.js";
import { paginate } from "../../../shared/utility/pagination.js";
import { userRepo } from "../../users/user.repo.js";
import { rewardSelect } from "./reward.dto.js";

class RewardRepo {
  // Build the scoped Prisma `where` for the rewards list (reference
  // convention: where-building lives in the repo).
  //   ADMIN  → optional single-user filter over everyone
  //   PARENT → their active-subscribed students (+ self), optional narrowing
  //   other  → just themselves
  async buildListWhere(authUser, { userId, status }) {
    const where = {};
    if (status) where.status = status;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (userId) where.userId = userId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const ids = await userRepo.getStudentIdsForParent(authUser.id);
      const activeIds = await filterActiveStudentIds(ids);
      const scope = [...activeIds, authUser.id];
      where.userId =
        userId && scope.includes(userId) ? userId : { in: scope };
    } else {
      where.userId = authUser.id;
    }
    return where;
  }

  async list({ page, limit, where = {}, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [items, total] = await Promise.all([
      db.reward.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: rewardSelect,
      }),
      db.reward.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).reward.findUnique({ where: { id }, select: rewardSelect });
  }

  create({ data, client } = {}) {
    return (client ?? prisma).reward.create({ data, select: rewardSelect });
  }

  markClaimed({ id, client } = {}) {
    return (client ?? prisma).reward.update({
      where: { id },
      data: { status: "CLAIMED", claimedAt: new Date() },
      select: rewardSelect,
    });
  }
}

export const rewardRepo = new RewardRepo();
export { RewardRepo };
