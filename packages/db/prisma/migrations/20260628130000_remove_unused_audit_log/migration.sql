-- Remove the unused AuditLog table (no code ever wrote to it).
-- The `AuditAction` enum was column-scoped in MySQL, so dropping the table
-- removes it; the userId -> User foreign key is dropped with the table.
DROP TABLE IF EXISTS `AuditLog`;
