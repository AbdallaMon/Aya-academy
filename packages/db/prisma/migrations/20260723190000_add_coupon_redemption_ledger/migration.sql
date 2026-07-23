-- Durable per-student coupon consumption ledger.
-- No historical data is backfilled here; existing Subscription rows remain the
-- compatibility source until a separate data backfill is intentionally run.

CREATE TABLE `CouponRedemption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `couponId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `subscriptionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CouponRedemption_couponId_studentId_key`(`couponId`, `studentId`),
    INDEX `CouponRedemption_studentId_idx`(`studentId`),
    INDEX `CouponRedemption_subscriptionId_idx`(`subscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CouponRedemption`
    ADD CONSTRAINT `CouponRedemption_couponId_fkey`
    FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CouponRedemption`
    ADD CONSTRAINT `CouponRedemption_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CouponRedemption`
    ADD CONSTRAINT `CouponRedemption_subscriptionId_fkey`
    FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
