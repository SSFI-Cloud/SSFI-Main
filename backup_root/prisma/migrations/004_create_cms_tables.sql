-- CMS Tables Migration
-- Run this after the existing schema

-- Hero Sliders
CREATE TABLE IF NOT EXISTS `tbl_sliders` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `image_url` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(255),
    `link_url` VARCHAR(500),
    `display_order` INT DEFAULT 0,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- News Ticker
CREATE TABLE IF NOT EXISTS `tbl_news_ticker` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `message` TEXT NOT NULL,
    `priority` INT DEFAULT 0,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sponsors
CREATE TABLE IF NOT EXISTS `tbl_sponsors` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `logo_url` VARCHAR(500) NOT NULL,
    `website_url` VARCHAR(500),
    `display_order` INT DEFAULT 0,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gallery Albums
CREATE TABLE IF NOT EXISTS `tbl_gallery_albums` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `cover_image` VARCHAR(500),
    `description` TEXT,
    `event_date` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gallery Images
CREATE TABLE IF NOT EXISTS `tbl_gallery_images` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `album_id` INT UNSIGNED NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(255),
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`album_id`) REFERENCES `tbl_gallery_albums`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- About Page Content
CREATE TABLE IF NOT EXISTS `tbl_page_content` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `page_key` VARCHAR(100) NOT NULL UNIQUE,
    `content` LONGTEXT,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default About content
INSERT IGNORE INTO `tbl_page_content` (`page_key`, `content`) VALUES 
('about', '<h1>About SSFI</h1><p>Welcome to the Skating Sports Federation of India.</p>');
