CREATE TABLE `Users` (
    `user_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `password` VARCHAR(50) NOT NULL,
    `account_type` ENUM('Listener', 'Musician') NOT NULL DEFAULT 'Listener',
    `registration_date` DATETIME NOT NULL,
    `profile_picture_url` VARCHAR(2000) NULL,
    `bio` TEXT NULL,
    `monthly_listeners` BIGINT NULL,
    `uh_affiliation` ENUM('Student', 'Alumni', 'Staff', 'None') NOT NULL DEFAULT 'None',
    `verification_status` BOOLEAN NOT NULL DEFAULT '0' COMMENT 'True if verified, False if unverified',
    `admin_role` BOOLEAN NOT NULL DEFAULT '0' COMMENT 'true = admin, false = regular user',
    PRIMARY KEY (`user_id`)
);

CREATE TABLE `Songs` (
    `song_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(50) NOT NULL,
    `musician_id` VARCHAR(50) NOT NULL,
    `upload_date` DATETIME NOT NULL,
    `genre` VARCHAR(50) NULL,
    `duration` INT NOT NULL,
    `file_url` VARCHAR(2000) NOT NULL,
    `cover_art_url` VARCHAR(2000) NULL,
    `description` TEXT NULL
);

CREATE TABLE `Playlists` (
    `playlist_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `creation_date` DATETIME NOT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT '0' COMMENT 'TRUE = Playlist is public, FALSE = Playlist is private'
);

CREATE TABLE `Playlist Songs` (
    `playlist_id` INT UNSIGNED NOT NULL,
    `song_id` INT UNSIGNED NOT NULL,
    `added_date` DATETIME NOT NULL,
    PRIMARY KEY (`playlist_id`, `song_id`),
    FOREIGN KEY (`playlist_id`) REFERENCES `Playlists`(`playlist_id`),
    FOREIGN KEY (`song_id`) REFERENCES `Songs`(`song_id`)
);

CREATE TABLE `Streaming History` (
    `stream_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `song_id` INT UNSIGNED NOT NULL,
    `timestamp` DATETIME NOT NULL,
    `duration_listened` INT NULL
);

CREATE TABLE `Likes` (
    `like_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `song_id` INT UNSIGNED NOT NULL,
    `timestamp` DATETIME NOT NULL
);

CREATE TABLE `Comments` (
    `comment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `song_id` INT UNSIGNED NOT NULL,
    `comment_text` TEXT NULL,
    `timestamp` DATETIME NOT NULL
);

CREATE TABLE `User Followers` (
    `follower_id` VARCHAR(50) NOT NULL,
    `followed_id` VARCHAR(50) NOT NULL,
    `timestamp` DATETIME NOT NULL,
    PRIMARY KEY (`follower_id`, `followed_id`)
);

CREATE TABLE `Song Collaborators` (
    `song_id` INT UNSIGNED NOT NULL,
    `musician_id` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`song_id`, `musician_id`),
    FOREIGN KEY (`song_id`) REFERENCES `Songs`(`song_id`),
    FOREIGN KEY (`musician_id`) REFERENCES `Users`(`user_id`)
);

-- Foreign Keys
ALTER TABLE `Comments` ADD CONSTRAINT `comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`);
ALTER TABLE `Playlists` ADD CONSTRAINT `playlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`);
ALTER TABLE `Comments` ADD CONSTRAINT `comments_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `Songs`(`song_id`);
ALTER TABLE `Likes` ADD CONSTRAINT `likes_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `Songs`(`song_id`);
ALTER TABLE `User Followers` ADD CONSTRAINT `user_followers_followed_id_foreign` FOREIGN KEY (`followed_id`) REFERENCES `Users`(`user_id`);
ALTER TABLE `Likes` ADD CONSTRAINT `likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`);
ALTER TABLE `Streaming History` ADD CONSTRAINT `streaming_history_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`);
ALTER TABLE `Streaming History` ADD CONSTRAINT `streaming_history_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `Songs`(`song_id`);
ALTER TABLE `Songs` ADD CONSTRAINT `songs_musician_id_foreign` FOREIGN KEY (`musician_id`) REFERENCES `Users`(`user_id`);

SHOW TABLES;



