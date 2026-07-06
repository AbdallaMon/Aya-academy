-- AlterTable
ALTER TABLE `AppSetting` ADD COLUMN `whiteboardRetentionDays` INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE `WhiteboardImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhiteboardImage_storageKey_key`(`storageKey`),
    INDEX `WhiteboardImage_sessionId_idx`(`sessionId`),
    INDEX `WhiteboardImage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhiteboardImage` ADD CONSTRAINT `WhiteboardImage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WhiteboardSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
