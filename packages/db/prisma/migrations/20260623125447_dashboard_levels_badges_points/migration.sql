-- AlterTable
ALTER TABLE `Badge` ADD COLUMN `bgColor` VARCHAR(191) NULL,
    ADD COLUMN `emoji` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `score` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `textColor` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `StudentBadge` ADD COLUMN `awardedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `banReason` TEXT NULL,
    ADD COLUMN `bannedAt` DATETIME(3) NULL,
    ADD COLUMN `studentLevel` ENUM('BEGINNER', 'EXPLORER', 'BUILDER', 'CONFIDENT_READER') NULL;

-- CreateTable
CREATE TABLE `Point` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `source` ENUM('BADGE', 'GAME', 'QUIZ', 'MANUAL', 'ADJUSTMENT') NOT NULL,
    `sourceId` INTEGER NULL,
    `badgeId` INTEGER NULL,
    `reason` TEXT NULL,
    `awardedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Point_studentId_idx`(`studentId`),
    INDEX `Point_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Point` ADD CONSTRAINT `Point_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Point` ADD CONSTRAINT `Point_awardedById_fkey` FOREIGN KEY (`awardedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
