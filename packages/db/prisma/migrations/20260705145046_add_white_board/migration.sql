-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('SUBSCRIPTION_CREATED', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_EXPIRED', 'REPORT_RECEIVED', 'SESSION_LOGGED', 'GAME_ASSIGNED', 'QUIZ_INVITE', 'QUIZ_PASSED', 'QUIZ_FAILED', 'GIFT_RECEIVED', 'INVOICE_SENT', 'CERTIFICATE_ISSUED', 'GENERIC') NOT NULL;

-- CreateTable
CREATE TABLE `WhiteboardSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ENDED') NOT NULL DEFAULT 'DRAFT',
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `publicTokenHash` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhiteboardSession_publicTokenHash_key`(`publicTokenHash`),
    INDEX `WhiteboardSession_createdById_idx`(`createdById`),
    INDEX `WhiteboardSession_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhiteboardSessionStudent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WhiteboardSessionStudent_studentId_idx`(`studentId`),
    UNIQUE INDEX `WhiteboardSessionStudent_sessionId_studentId_key`(`sessionId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhiteboardSession` ADD CONSTRAINT `WhiteboardSession_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhiteboardSessionStudent` ADD CONSTRAINT `WhiteboardSessionStudent_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `WhiteboardSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhiteboardSessionStudent` ADD CONSTRAINT `WhiteboardSessionStudent_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
