-- Plan now stores ONLY hours; price derives from the global hourly rate.
ALTER TABLE `Plan`
  DROP COLUMN `currency`,
  DROP COLUMN `hourlyRate`,
  DROP COLUMN `monthlyPrice`,
  DROP COLUMN `yearlyPrice`;

-- Invoice: drop the free-hours figure; default currency to USD.
ALTER TABLE `Invoice` DROP COLUMN `freeHours`;
ALTER TABLE `Invoice` MODIFY `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';
