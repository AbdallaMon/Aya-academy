-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailNotificationsEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `inAppNotificationsEnabled` BOOLEAN NOT NULL DEFAULT true;
