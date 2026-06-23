-- AlterTable
ALTER TABLE `Certificate` ADD COLUMN `photoId` INTEGER NULL,
    ADD COLUMN `reasonAr` TEXT NULL,
    ADD COLUMN `reasonEn` TEXT NULL,
    ADD COLUMN `templateId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CertificateTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `headingAr` VARCHAR(191) NULL,
    `headingEn` VARCHAR(191) NULL,
    `introAr` TEXT NULL,
    `introEn` TEXT NULL,
    `bodyAr` TEXT NULL,
    `bodyEn` TEXT NULL,
    `congratsAr` TEXT NULL,
    `congratsEn` TEXT NULL,
    `thanksAr` TEXT NULL,
    `thanksEn` TEXT NULL,
    `signatureName` VARCHAR(191) NULL,
    `signatureTitleAr` VARCHAR(191) NULL,
    `signatureTitleEn` VARCHAR(191) NULL,
    `themeJson` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CertificateTemplate_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Certificate_templateId_idx` ON `Certificate`(`templateId`);

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `CertificateTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Attachment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
