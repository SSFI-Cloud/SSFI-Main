-- CreateTable: Donations
CREATE TABLE `donations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donorName` VARCHAR(191) NOT NULL,
    `donorEmail` VARCHAR(191) NOT NULL,
    `donorPhone` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `message` TEXT NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `donations_status_idx`(`status`),
    INDEX `donations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Add FK columns to payments
ALTER TABLE `payments` ADD COLUMN `coachCertRegistrationId` INTEGER NULL,
    ADD COLUMN `beginnerCertRegistrationId` INTEGER NULL,
    ADD COLUMN `donationId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_coachCertRegistrationId_key` ON `payments`(`coachCertRegistrationId`);
CREATE UNIQUE INDEX `payments_beginnerCertRegistrationId_key` ON `payments`(`beginnerCertRegistrationId`);
CREATE UNIQUE INDEX `payments_donationId_key` ON `payments`(`donationId`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_coachCertRegistrationId_fkey` FOREIGN KEY (`coachCertRegistrationId`) REFERENCES `coach_cert_registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_beginnerCertRegistrationId_fkey` FOREIGN KEY (`beginnerCertRegistrationId`) REFERENCES `beginner_cert_registrations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_donationId_fkey` FOREIGN KEY (`donationId`) REFERENCES `donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
