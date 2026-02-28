-- Settings table for storing configuration (including Razorpay keys)
CREATE TABLE IF NOT EXISTS `tbl_settings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `is_encrypted` BOOLEAN DEFAULT FALSE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment links table
CREATE TABLE IF NOT EXISTS `tbl_payment_links` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `razorpay_link_id` VARCHAR(100) NOT NULL,
    `purpose` ENUM('membership_renewal', 'event_registration') NOT NULL,
    `user_id` INT UNSIGNED NULL,
    `skater_id` INT UNSIGNED NULL,
    `event_id` INT UNSIGNED NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `short_url` VARCHAR(255) NOT NULL,
    `status` ENUM('created', 'paid', 'expired', 'cancelled') DEFAULT 'created',
    `payment_id` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `paid_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment transactions log
CREATE TABLE IF NOT EXISTS `tbl_payments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `razorpay_payment_id` VARCHAR(100) NOT NULL,
    `razorpay_order_id` VARCHAR(100) NULL,
    `razorpay_link_id` VARCHAR(100) NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'INR',
    `status` VARCHAR(50) NOT NULL,
    `purpose` ENUM('membership_renewal', 'event_registration') NOT NULL,
    `user_id` INT UNSIGNED NULL,
    `skater_id` INT UNSIGNED NULL,
    `event_id` INT UNSIGNED NULL,
    `webhook_payload` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default Razorpay settings (empty values)
INSERT INTO `tbl_settings` (`setting_key`, `setting_value`, `is_encrypted`) VALUES
('razorpay_key_id', '', FALSE),
('razorpay_key_secret', '', TRUE),
('razorpay_webhook_secret', '', TRUE)
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
