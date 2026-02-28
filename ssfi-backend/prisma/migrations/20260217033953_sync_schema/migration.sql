/*
  Warnings:

  - You are about to drop the column `calculatedAge` on the `event_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `event_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `disciplines` on the `event_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `event_registrations` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `event_registrations` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `VarChar(191)`.
  - You are about to alter the column `paymentStatus` on the `event_registrations` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `VarChar(191)`.
  - The primary key for the `gallery_albums` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isActive` on the `gallery_albums` table. All the data in the column will be lost.
  - The primary key for the `news` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `image` on the `news` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `news` table. All the data in the column will be lost.
  - The primary key for the `pages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isActive` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `metaDesc` on the `pages` table. All the data in the column will be lost.
  - The primary key for the `registration_windows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fee` on the `registration_windows` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `registration_windows` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `registration_windows` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `type` on the `registration_windows` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to drop the `gallery_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sliders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sponsors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[confirmationNumber]` on the table `event_registrations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `gallery_albums` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `confirmationNumber` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryFee` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedRaces` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skateCategory` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suitSize` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFee` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Made the column `ageCategory` on table `event_registrations` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `slug` to the `gallery_albums` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseFee` to the `registration_windows` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `gallery_images` DROP FOREIGN KEY `gallery_images_albumId_fkey`;

-- AlterTable
ALTER TABLE `clubs` ADD COLUMN `aadhaarNumber` VARCHAR(50) NULL,
    ADD COLUMN `certificate` VARCHAR(100) NULL,
    ADD COLUMN `club` VARCHAR(255) NULL,
    ADD COLUMN `clubAddress` TEXT NULL,
    ADD COLUMN `clubName` VARCHAR(255) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `emailAddress` VARCHAR(255) NULL,
    ADD COLUMN `logoPath` VARCHAR(255) NULL,
    ADD COLUMN `membershipId` VARCHAR(100) NULL,
    ADD COLUMN `mobileNumber` VARCHAR(20) NULL,
    ADD COLUMN `passport` VARCHAR(100) NULL,
    ADD COLUMN `proof` VARCHAR(100) NULL,
    ADD COLUMN `tshirtSize` VARCHAR(50) NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL,
    ADD COLUMN `verified` INTEGER NULL DEFAULT 0,
    ADD COLUMN `verifiedBy` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `event_registrations` DROP COLUMN `calculatedAge`,
    DROP COLUMN `categories`,
    DROP COLUMN `disciplines`,
    DROP COLUMN `fee`,
    ADD COLUMN `adminAddedAt` DATETIME(3) NULL,
    ADD COLUMN `adminAddedBy` VARCHAR(191) NULL,
    ADD COLUMN `cancellationReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledBy` VARCHAR(191) NULL,
    ADD COLUMN `confirmationNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `districtId` INTEGER NULL,
    ADD COLUMN `eligibleEventLevelId` INTEGER UNSIGNED NULL,
    ADD COLUMN `entryFee` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `eventLevelTypeId` INTEGER UNSIGNED NULL,
    ADD COLUMN `isPresent` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `lateFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `orderId` VARCHAR(100) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentDetails` JSON NULL,
    ADD COLUMN `paymentId` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `prizeAnnouncementPlace` VARCHAR(100) NULL,
    ADD COLUMN `result` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `selectedRaces` JSON NOT NULL,
    ADD COLUMN `sessionId` INTEGER NULL,
    ADD COLUMN `skateCategory` VARCHAR(191) NOT NULL,
    ADD COLUMN `stateId` INTEGER NULL,
    ADD COLUMN `suitSize` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalFee` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `transactionId` VARCHAR(191) NULL,
    MODIFY `ageCategory` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `events` ADD COLUMN `eventFees` DECIMAL(10, 2) NULL,
    ADD COLUMN `eventImage` VARCHAR(255) NULL,
    ADD COLUMN `eventLevelTypeId` INTEGER UNSIGNED NULL,
    ADD COLUMN `eventRemarks` TEXT NULL,
    ADD COLUMN `isResultsPublished` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `regNo` VARCHAR(100) NULL,
    ADD COLUMN `sessionId` INTEGER NULL DEFAULT 4,
    ADD COLUMN `titleOfChampionship` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `gallery_albums` DROP PRIMARY KEY,
    DROP COLUMN `isActive`,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `eventId` INTEGER NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `updatedBy` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `news` DROP PRIMARY KEY,
    DROP COLUMN `image`,
    DROP COLUMN `isActive`,
    ADD COLUMN `allowComments` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `excerpt` TEXT NULL,
    ADD COLUMN `featuredImage` VARCHAR(191) NULL,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` VARCHAR(191) NULL,
    ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `tags` JSON NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `publishedAt` DATETIME(3) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `pages` DROP PRIMARY KEY,
    DROP COLUMN `isActive`,
    DROP COLUMN `metaDesc`,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `excerpt` TEXT NULL,
    ADD COLUMN `featuredImage` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` VARCHAR(191) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `template` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD COLUMN `updatedBy` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `registration_windows` DROP PRIMARY KEY,
    DROP COLUMN `fee`,
    DROP COLUMN `instructions`,
    ADD COLUMN `baseFee` INTEGER NOT NULL,
    ADD COLUMN `isPaused` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lateFeeAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lateFeeStart` DATE NULL,
    ADD COLUMN `maxRegistrations` INTEGER NULL,
    ADD COLUMN `registrationsCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `type` VARCHAR(20) NOT NULL,
    MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `startDate` DATE NOT NULL,
    MODIFY `endDate` DATE NOT NULL,
    MODIFY `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `students` ADD COLUMN `categoryTypeId` INTEGER UNSIGNED NULL,
    ADD COLUMN `coachMobileNumber` VARCHAR(191) NULL,
    ADD COLUMN `iAm` VARCHAR(100) NULL,
    ADD COLUMN `identityProof` VARCHAR(255) NULL,
    ADD COLUMN `membershipId` VARCHAR(100) NULL,
    ADD COLUMN `residentialAddress` TEXT NULL,
    ADD COLUMN `verified` INTEGER NULL DEFAULT 0,
    ADD COLUMN `verifiedBy` INTEGER NULL DEFAULT 0;

-- DropTable
DROP TABLE `gallery_images`;

-- DropTable
DROP TABLE `sliders`;

-- DropTable
DROP TABLE `sponsors`;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `mobileImageUrl` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `linkText` VARCHAR(191) NULL,
    `position` VARCHAR(191) NOT NULL DEFAULT 'HOME_HERO',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `banners_position_idx`(`position`),
    INDEX `banners_status_idx`(`status`),
    INDEX `banners_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_items` (
    `id` VARCHAR(191) NOT NULL,
    `albumId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'IMAGE',
    `url` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `gallery_items_albumId_idx`(`albumId`),
    INDEX `gallery_items_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `id` VARCHAR(191) NOT NULL,
    `siteName` VARCHAR(191) NOT NULL DEFAULT 'SSFI',
    `siteTagline` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `favicon` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `footerText` TEXT NULL,
    `socialLinks` JSON NULL,
    `googleAnalyticsId` VARCHAR(191) NULL,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMessage` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_category_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cat_name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_event_level_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_level` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_eligible_event_level` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_type_id` INTEGER UNSIGNED NOT NULL,
    `event_level_type_id` INTEGER UNSIGNED NOT NULL,
    `event_level_name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_session` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_name` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_session_renewal` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `skater_id` INTEGER NOT NULL,
    `session_id` INTEGER UNSIGNED NOT NULL,
    `payment_id` VARCHAR(100) NULL,
    `order_id` VARCHAR(100) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission_modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_name` VARCHAR(100) NOT NULL,
    `module_slug` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER NOT NULL,
    `permission_name` VARCHAR(100) NOT NULL,
    `permission_slug` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permission_module_id_idx`(`module_id`),
    INDEX `permission_permission_slug_idx`(`permission_slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_privileges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_add` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_privileges_role_id_idx`(`role_id`),
    INDEX `staff_privileges_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `staff_privileges_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branch_id` INTEGER NOT NULL,
    `user_id` VARCHAR(50) NOT NULL,
    `role_id` INTEGER NULL,
    `club_id` INTEGER NULL,
    `username` VARCHAR(100) NOT NULL,
    `member_id` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `full_name` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `email_address` VARCHAR(255) NOT NULL,
    `mobile_number` VARCHAR(15) NOT NULL,
    `aadhar_number` VARCHAR(20) NOT NULL,
    `residential_address` TEXT NOT NULL,
    `state_id` INTEGER NOT NULL,
    `district_id` INTEGER NOT NULL,
    `identity_proof` VARCHAR(255) NOT NULL,
    `profile_photo` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(255) NULL,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tbl_user_user_id_idx`(`user_id`),
    INDEX `tbl_user_username_idx`(`username`),
    INDEX `tbl_user_email_address_idx`(`email_address`),
    INDEX `tbl_user_role_id_idx`(`role_id`),
    INDEX `tbl_user_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_failures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(255) NULL,
    `payment_id` VARCHAR(255) NULL,
    `error_code` VARCHAR(100) NULL,
    `error_description` TEXT NULL,
    `error_source` VARCHAR(100) NULL,
    `error_reason` VARCHAR(255) NULL,
    `amount` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `payment_failures_order_id_idx`(`order_id`),
    INDEX `payment_failures_payment_id_idx`(`payment_id`),
    INDEX `payment_failures_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `author` VARCHAR(100) NOT NULL,
    `featuredImage` VARCHAR(255) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_articles_slug_key`(`slug`),
    INDEX `news_articles_slug_idx`(`slug`),
    INDEX `news_articles_category_idx`(`category`),
    INDEX `news_articles_isPublished_idx`(`isPublished`),
    INDEX `news_articles_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `front_cms_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `application_title` VARCHAR(255) NOT NULL,
    `url_alias` VARCHAR(255) NULL,
    `cms_active` TINYINT NOT NULL DEFAULT 0,
    `online_admission` TINYINT NOT NULL DEFAULT 0,
    `theme` VARCHAR(255) NOT NULL,
    `captcha_status` VARCHAR(20) NOT NULL,
    `recaptcha_site_key` VARCHAR(255) NOT NULL,
    `recaptcha_secret_key` VARCHAR(255) NOT NULL,
    `address` VARCHAR(350) NOT NULL,
    `mobile_no` VARCHAR(60) NOT NULL,
    `fax` VARCHAR(60) NOT NULL,
    `receive_contact_email` VARCHAR(255) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `copyright_text` VARCHAR(255) NOT NULL,
    `fav_icon` VARCHAR(255) NOT NULL,
    `logo` VARCHAR(255) NOT NULL,
    `footer_about_text` VARCHAR(300) NOT NULL,
    `working_hours` VARCHAR(300) NOT NULL,
    `google_analytics` TEXT NULL,
    `primary_color` VARCHAR(100) NOT NULL DEFAULT '#ff685c',
    `menu_color` VARCHAR(100) NOT NULL DEFAULT '#fff',
    `hover_color` VARCHAR(100) NOT NULL DEFAULT '#f04133',
    `text_color` VARCHAR(100) NOT NULL DEFAULT '#232323',
    `text_secondary_color` VARCHAR(100) NOT NULL DEFAULT '#383838',
    `footer_background_color` VARCHAR(100) NOT NULL DEFAULT '#383838',
    `footer_text_color` VARCHAR(100) NOT NULL DEFAULT '#8d8d8d',
    `copyright_bg_color` VARCHAR(100) NOT NULL DEFAULT '#262626',
    `copyright_text_color` VARCHAR(100) NOT NULL DEFAULT '#8d8d8d',
    `border_radius` VARCHAR(100) NOT NULL DEFAULT '0',
    `facebook_url` VARCHAR(100) NOT NULL,
    `twitter_url` VARCHAR(100) NOT NULL,
    `youtube_url` VARCHAR(100) NOT NULL,
    `google_plus` VARCHAR(100) NOT NULL,
    `linkedin_url` VARCHAR(100) NOT NULL,
    `pinterest_url` VARCHAR(100) NOT NULL,
    `instagram_url` VARCHAR(100) NOT NULL,
    `branch_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `institute_name` VARCHAR(255) NOT NULL,
    `institution_code` VARCHAR(255) NOT NULL,
    `reg_prefix` VARCHAR(255) NOT NULL,
    `institute_email` VARCHAR(100) NOT NULL,
    `address` TEXT NOT NULL,
    `mobileno` VARCHAR(100) NOT NULL,
    `currency` VARCHAR(100) NOT NULL,
    `currency_symbol` VARCHAR(100) NOT NULL,
    `sms_service_provider` VARCHAR(100) NOT NULL,
    `session_id` INTEGER NOT NULL,
    `translation` VARCHAR(100) NOT NULL,
    `footer_text` VARCHAR(255) NOT NULL,
    `animations` VARCHAR(100) NOT NULL,
    `timezone` VARCHAR(100) NOT NULL,
    `date_format` VARCHAR(100) NOT NULL,
    `facebook_url` VARCHAR(255) NOT NULL,
    `twitter_url` VARCHAR(255) NOT NULL,
    `linkedin_url` VARCHAR(255) NOT NULL,
    `youtube_url` VARCHAR(255) NOT NULL,
    `cron_secret_key` VARCHAR(255) NULL,
    `preloader_backend` BOOLEAN NOT NULL DEFAULT true,
    `footer_branch_switcher` BOOLEAN NOT NULL DEFAULT true,
    `cms_default_branch` INTEGER NOT NULL,
    `image_extension` TEXT NULL,
    `image_size` DOUBLE NOT NULL DEFAULT 1024,
    `file_extension` TEXT NULL,
    `pid` VARCHAR(255) NULL,
    `file_size` DOUBLE NULL DEFAULT 1024,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_api` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_url` TEXT NULL,
    `access_token` TEXT NULL,
    `phone_number_id` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `race_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `raceType` VARCHAR(191) NOT NULL,
    `skateCategory` VARCHAR(191) NOT NULL,
    `ageCategory` VARCHAR(191) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `position` INTEGER NOT NULL,
    `timing` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `race_results_eventId_idx`(`eventId`),
    INDEX `race_results_studentId_idx`(`studentId`),
    UNIQUE INDEX `race_results_eventId_raceType_skateCategory_ageCategory_gend_key`(`eventId`, `raceType`, `skateCategory`, `ageCategory`, `gender`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `coach_trainings_startDate_endDate_idx` ON `coach_trainings`(`startDate`, `endDate`);

-- CreateIndex
CREATE INDEX `coach_trainings_isActive_idx` ON `coach_trainings`(`isActive`);

-- CreateIndex
CREATE INDEX `district_secretaries_uid_idx` ON `district_secretaries`(`uid`);

-- CreateIndex
CREATE INDEX `district_secretaries_email_idx` ON `district_secretaries`(`email`);

-- CreateIndex
CREATE INDEX `district_secretaries_status_idx` ON `district_secretaries`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `event_registrations_confirmationNumber_key` ON `event_registrations`(`confirmationNumber`);

-- CreateIndex
CREATE INDEX `event_registrations_districtId_idx` ON `event_registrations`(`districtId`);

-- CreateIndex
CREATE INDEX `event_registrations_stateId_idx` ON `event_registrations`(`stateId`);

-- CreateIndex
CREATE INDEX `events_eventLevel_status_idx` ON `events`(`eventLevel`, `status`);

-- CreateIndex
CREATE INDEX `events_stateId_status_idx` ON `events`(`stateId`, `status`);

-- CreateIndex
CREATE INDEX `events_districtId_status_idx` ON `events`(`districtId`, `status`);

-- CreateIndex
CREATE INDEX `events_eventDate_status_idx` ON `events`(`eventDate`, `status`);

-- CreateIndex
CREATE INDEX `fee_structures_entityType_idx` ON `fee_structures`(`entityType`);

-- CreateIndex
CREATE INDEX `fee_structures_isActive_idx` ON `fee_structures`(`isActive`);

-- CreateIndex
CREATE UNIQUE INDEX `gallery_albums_slug_key` ON `gallery_albums`(`slug`);

-- CreateIndex
CREATE INDEX `news_status_idx` ON `news`(`status`);

-- CreateIndex
CREATE INDEX `news_category_idx` ON `news`(`category`);

-- CreateIndex
CREATE INDEX `registration_windows_type_idx` ON `registration_windows`(`type`);

-- CreateIndex
CREATE INDEX `registration_windows_startDate_endDate_idx` ON `registration_windows`(`startDate`, `endDate`);

-- CreateIndex
CREATE INDEX `registration_windows_isActive_idx` ON `registration_windows`(`isActive`);

-- CreateIndex
CREATE INDEX `state_secretaries_uid_idx` ON `state_secretaries`(`uid`);

-- CreateIndex
CREATE INDEX `state_secretaries_email_idx` ON `state_secretaries`(`email`);

-- CreateIndex
CREATE INDEX `state_secretaries_status_idx` ON `state_secretaries`(`status`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_categoryTypeId_fkey` FOREIGN KEY (`categoryTypeId`) REFERENCES `tbl_category_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_eventLevelTypeId_fkey` FOREIGN KEY (`eventLevelTypeId`) REFERENCES `tbl_event_level_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_districtId_fkey` FOREIGN KEY (`districtId`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_eventLevelTypeId_fkey` FOREIGN KEY (`eventLevelTypeId`) REFERENCES `tbl_event_level_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_eligibleEventLevelId_fkey` FOREIGN KEY (`eligibleEventLevelId`) REFERENCES `tbl_eligible_event_level`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery_albums` ADD CONSTRAINT `gallery_albums_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery_items` ADD CONSTRAINT `gallery_items_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `gallery_albums`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_eligible_event_level` ADD CONSTRAINT `tbl_eligible_event_level_category_type_id_fkey` FOREIGN KEY (`category_type_id`) REFERENCES `tbl_category_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_eligible_event_level` ADD CONSTRAINT `tbl_eligible_event_level_event_level_type_id_fkey` FOREIGN KEY (`event_level_type_id`) REFERENCES `tbl_event_level_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_session_renewal` ADD CONSTRAINT `tbl_session_renewal_skater_id_fkey` FOREIGN KEY (`skater_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_session_renewal` ADD CONSTRAINT `tbl_session_renewal_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `tbl_session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission` ADD CONSTRAINT `permission_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `permission_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_privileges` ADD CONSTRAINT `staff_privileges_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_privileges` ADD CONSTRAINT `staff_privileges_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_user` ADD CONSTRAINT `tbl_user_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `race_results` ADD CONSTRAINT `race_results_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `race_results` ADD CONSTRAINT `race_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `district_secretaries` RENAME INDEX `district_secretaries_districtId_fkey` TO `district_secretaries_districtId_idx`;

-- RenameIndex
ALTER TABLE `district_secretaries` RENAME INDEX `district_secretaries_stateId_fkey` TO `district_secretaries_stateId_idx`;

-- RenameIndex
ALTER TABLE `events` RENAME INDEX `events_creatorId_fkey` TO `events_creatorId_idx`;

-- RenameIndex
ALTER TABLE `state_secretaries` RENAME INDEX `state_secretaries_stateId_fkey` TO `state_secretaries_stateId_idx`;
