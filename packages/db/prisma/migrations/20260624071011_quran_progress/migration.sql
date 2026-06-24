-- AlterTable
ALTER TABLE `LessonSession` ADD COLUMN `homework` TEXT NULL;

-- CreateTable
CREATE TABLE `QuranSurah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `ayahCount` INTEGER NOT NULL,
    `revelationPlace` ENUM('MAKKI', 'MADANI') NOT NULL,

    UNIQUE INDEX `QuranSurah_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuranJuz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `QuranJuz_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuranJuzSegment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `juzId` INTEGER NOT NULL,
    `surahId` INTEGER NOT NULL,
    `fromAyah` INTEGER NOT NULL,
    `toAyah` INTEGER NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `QuranJuzSegment_juzId_idx`(`juzId`),
    INDEX `QuranJuzSegment_surahId_idx`(`surahId`),
    UNIQUE INDEX `QuranJuzSegment_juzId_surahId_key`(`juzId`, `surahId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSegmentProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `segmentId` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL,
    `currentAyah` INTEGER NULL,
    `completedAt` DATETIME(3) NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentSegmentProgress_studentId_idx`(`studentId`),
    UNIQUE INDEX `StudentSegmentProgress_studentId_segmentId_key`(`studentId`, `segmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `kind` ENUM('MEMORIZE', 'REVIEW') NOT NULL,
    `surahId` INTEGER NOT NULL,
    `fromAyah` INTEGER NULL,
    `toAyah` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LessonAssignment_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuranJuzSegment` ADD CONSTRAINT `QuranJuzSegment_juzId_fkey` FOREIGN KEY (`juzId`) REFERENCES `QuranJuz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuranJuzSegment` ADD CONSTRAINT `QuranJuzSegment_surahId_fkey` FOREIGN KEY (`surahId`) REFERENCES `QuranSurah`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSegmentProgress` ADD CONSTRAINT `StudentSegmentProgress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSegmentProgress` ADD CONSTRAINT `StudentSegmentProgress_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `QuranJuzSegment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentSegmentProgress` ADD CONSTRAINT `StudentSegmentProgress_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAssignment` ADD CONSTRAINT `LessonAssignment_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `LessonSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAssignment` ADD CONSTRAINT `LessonAssignment_surahId_fkey` FOREIGN KEY (`surahId`) REFERENCES `QuranSurah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
