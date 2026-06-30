import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { rewardSelect } from "./reward.dto.js";

class RewardRepo {
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
