/*
  Warnings:

  - The values [CUSTOM] on the enum `Certificate_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Certificate` MODIFY `type` ENUM('GAME', 'QUIZ', 'MANUAL') NOT NULL;
