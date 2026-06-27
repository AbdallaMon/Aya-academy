-- AlterTable
ALTER TABLE `CertificateTemplate` ADD COLUMN `type` ENUM('GENERAL', 'GAME') NOT NULL DEFAULT 'GENERAL';
