-- CreateTable
CREATE TABLE `SessionLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `teacherId` INTEGER NULL,
    `subjectsJson` JSON NOT NULL,
    `durationHours` DECIMAL(4, 2) NOT NULL,
    `rating` ENUM('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'WEAK') NULL,
    `report` TEXT NULL,
    `attendance` ENUM('PRESENT', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
    `sessionDate` DATETIME(3) NOT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SessionLog_studentId_idx`(`studentId`),
    INDEX `SessionLog_teacherId_idx`(`teacherId`),
    INDEX `SessionLog_sessionDate_idx`(`sessionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessionLog` ADD CONSTRAINT `SessionLog_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionLog` ADD CONSTRAINT `SessionLog_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionLog` ADD CONSTRAINT `SessionLog_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
