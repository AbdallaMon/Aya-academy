-- Additive-only guard for new writes. Historical subscriptions remain NULL and
-- are not changed by this migration.
ALTER TABLE `Subscription`
    ADD COLUMN `usageMonthKey` VARCHAR(32) NULL;

CREATE UNIQUE INDEX `Subscription_usageMonthKey_key`
    ON `Subscription`(`usageMonthKey`);
