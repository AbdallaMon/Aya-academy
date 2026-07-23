-- Add minute-based duration fields without modifying historical values.
-- Existing data is migrated separately with `npm run migrate:minutes`.

ALTER TABLE `Subscription`
    ADD COLUMN `subsMinutes` INTEGER NULL,
    ADD COLUMN `remainingMinutes` INTEGER NULL;

ALTER TABLE `Invoice`
    ADD COLUMN `minutes` INTEGER NULL;

ALTER TABLE `SessionLog`
    MODIFY `durationHours` DECIMAL(4, 2) NULL,
    ADD COLUMN `durationMinutes` INTEGER NULL;
