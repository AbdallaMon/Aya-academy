// Reward projection including the linked coupon (so the UI can show the code).
export const rewardSelect = {
  id: true,
  type: true,
  status: true,
  userId: true,
  couponId: true,
  freeLectureCount: true,
  sourceType: true,
  sourceId: true,
  claimedAt: true,
  createdAt: true,
  coupon: {
    select: { id: true, code: true, type: true, value: true, source: true },
  },
};
