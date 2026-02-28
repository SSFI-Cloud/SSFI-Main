-- AlterEnum
-- Add new AccountStatus enum values
-- ALTER TABLE `users` MODIFY `accountStatus` ENUM('ACTIVE', 'EXPIRED', 'LOCKED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
-- Add renewal tracking fields to users table
ALTER TABLE `users` 
    ADD COLUMN `accountStatus` ENUM('ACTIVE', 'EXPIRED', 'LOCKED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' AFTER `approvalStatus`,
    ADD COLUMN `renewalNotificationSent` BOOLEAN NOT NULL DEFAULT false AFTER `lastRenewalDate`,
    ADD COLUMN `renewalPeriodMonths` INTEGER NOT NULL DEFAULT 12 AFTER `renewalNotificationSent`;
