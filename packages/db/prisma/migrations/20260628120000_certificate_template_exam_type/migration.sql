-- AlterTable: add EXAM to the CertificateTemplate type enum (auto-applied to
-- quiz/exam certificates; multiple may exist, one active at a time).
ALTER TABLE `CertificateTemplate` MODIFY `type` ENUM('GENERAL', 'GAME', 'EXAM') NOT NULL DEFAULT 'GENERAL';
