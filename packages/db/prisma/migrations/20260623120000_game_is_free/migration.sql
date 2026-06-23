-- AlterTable
ALTER TABLE `Game` ADD COLUMN `isFree` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Game_isFree_idx` ON `Game`(`isFree`);

-- Backfill: make the seeded public trial game the default free game so the
-- marketing /free-game page keeps working immediately after this migration.
UPDATE `Game` SET `isFree` = true WHERE `slug` = 'phone-manners';
