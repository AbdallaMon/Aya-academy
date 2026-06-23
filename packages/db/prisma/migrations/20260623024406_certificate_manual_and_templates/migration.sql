/*
  Warnings:

  - Added the required column `updatedAt` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Certificate` ADD COLUMN `bodyAr` TEXT NULL,
    ADD COLUMN `bodyEn` TEXT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdById` INTEGER NULL,
    ADD COLUMN `templateKey` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `type` ENUM('GAME', 'QUIZ', 'MANUAL', 'CUSTOM') NOT NULL;

-- CreateIndex
CREATE INDEX `Certificate_createdById_idx` ON `Certificate`(`createdById`);

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
