import { prisma } from "@aya/db/prisma.client.js";
import { rewardSelect } from "./reward.dto.js";

class RewardRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: rewardSelect,
      }),
      prisma.reward.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.reward.findUnique({ where: { id }, select: rewardSelect });
  }

  create(data, tx) {
    const client = tx ?? prisma;
    return client.reward.create({ data, select: rewardSelect });
  }

  markClaimed(id) {
    return prisma.reward.update({
      where: { id },
      data: { status: "CLAIMED", claimedAt: new Date() },
      select: rewardSelect,
    });
  }
}

export const rewardRepo = new RewardRepo();
