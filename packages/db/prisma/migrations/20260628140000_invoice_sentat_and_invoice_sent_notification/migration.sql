-- Additive: invoice "send to parent" support + new notification type.
-- 1) Track when an invoice was last sent to the parent (null = never sent).
ALTER TABLE `Invoice` ADD COLUMN `sentAt` DATETIME(3) NULL;

-- 2) Add INVOICE_SENT to the column-scoped NotificationType enum on Notification.type.
--    Order matches packages/db/prisma/schema.prisma (INVOICE_SENT before GENERIC).
ALTER TABLE `Notification` MODIFY `type` ENUM(
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_EXPIRING',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_EXPIRED',
  'REPORT_RECEIVED',
  'GAME_ASSIGNED',
  'QUIZ_INVITE',
  'QUIZ_PASSED',
  'QUIZ_FAILED',
  'GIFT_RECEIVED',
  'INVOICE_SENT',
  'GENERIC'
) NOT NULL;
