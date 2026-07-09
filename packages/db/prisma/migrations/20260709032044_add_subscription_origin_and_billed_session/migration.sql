-- AlterTable
ALTER TABLE `SessionLog` ADD COLUMN `billedSubscriptionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `origin` ENUM('MANUAL', 'USAGE') NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX `SessionLog_studentId_sessionDate_billedSubscriptionId_idx` ON `SessionLog`(`studentId`, `sessionDate`, `billedSubscriptionId`);

-- CreateIndex
CREATE INDEX `Subscription_studentId_status_origin_idx` ON `Subscription`(`studentId`, `status`, `origin`);

-- AddForeignKey
ALTER TABLE `SessionLog` ADD CONSTRAINT `SessionLog_billedSubscriptionId_fkey` FOREIGN KEY (`billedSubscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
