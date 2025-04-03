-- MySQL dump 10.13  Distrib 8.0.41, for macos15 (x86_64)
--
-- Host: coogsmusic-database-server.mysql.database.azure.com    Database: main_database
-- ------------------------------------------------------
-- Server version	8.0.40-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `album_songs`
--

DROP TABLE IF EXISTS `album_songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album_songs` (
  `album_id` int unsigned NOT NULL,
  `song_id` int unsigned NOT NULL,
  `added_date` datetime NOT NULL,
  PRIMARY KEY (`album_id`,`song_id`),
  KEY `album_songs_song_id_foreign` (`song_id`),
  CONSTRAINT `album_songs_album_id_foreign` FOREIGN KEY (`album_id`) REFERENCES `albums` (`album_id`) ON DELETE CASCADE,
  CONSTRAINT `album_songs_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album_songs`
--

LOCK TABLES `album_songs` WRITE;
/*!40000 ALTER TABLE `album_songs` DISABLE KEYS */;
/*!40000 ALTER TABLE `album_songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `albums`
--

DROP TABLE IF EXISTS `albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `albums` (
  `album_id` int unsigned NOT NULL AUTO_INCREMENT,
  `musician_id` int unsigned NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `release_date` datetime NOT NULL,
  `album_art_url` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` mediumtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`album_id`),
  KEY `albums_musician_id_foreign` (`musician_id`),
  CONSTRAINT `albums_musician_id_foreign` FOREIGN KEY (`musician_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `albums`
--

LOCK TABLES `albums` WRITE;
/*!40000 ALTER TABLE `albums` DISABLE KEYS */;
/*!40000 ALTER TABLE `albums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `song_id` int unsigned NOT NULL,
  `comment_text` text,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `comments_user_id_foreign` (`user_id`),
  KEY `comments_song_id_foreign` (`song_id`),
  CONSTRAINT `comments_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE,
  CONSTRAINT `comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `like_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `song_id` int unsigned NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`like_id`),
  KEY `likes_user_id_foreign` (`user_id`),
  KEY `likes_song_id_foreign` (`song_id`),
  CONSTRAINT `likes_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE,
  CONSTRAINT `likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlist songs`
--

DROP TABLE IF EXISTS `playlist songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist songs` (
  `playlist_id` int unsigned NOT NULL,
  `song_id` int unsigned NOT NULL,
  `added_date` datetime NOT NULL,
  PRIMARY KEY (`playlist_id`,`song_id`),
  KEY `playlist_songs_song_id_fk` (`song_id`),
  CONSTRAINT `playlist_songs_playlist_id_fk` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`playlist_id`) ON DELETE CASCADE,
  CONSTRAINT `playlist_songs_song_id_fk` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlist songs`
--

LOCK TABLES `playlist songs` WRITE;
/*!40000 ALTER TABLE `playlist songs` DISABLE KEYS */;
/*!40000 ALTER TABLE `playlist songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlists`
--

DROP TABLE IF EXISTS `playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlists` (
  `playlist_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `creation_date` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'TRUE = Playlist is public, FALSE = Playlist is private',
  PRIMARY KEY (`playlist_id`),
  KEY `playlists_user_id_foreign` (`user_id`),
  CONSTRAINT `playlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlists`
--

LOCK TABLES `playlists` WRITE;
/*!40000 ALTER TABLE `playlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `playlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `song collaborators`
--

DROP TABLE IF EXISTS `song collaborators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `song collaborators` (
  `song_id` int unsigned NOT NULL,
  `musician_id` varchar(50) NOT NULL,
  PRIMARY KEY (`song_id`,`musician_id`),
  KEY `musician_id` (`musician_id`),
  CONSTRAINT `song collaborators_ibfk_1` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `song collaborators`
--

LOCK TABLES `song collaborators` WRITE;
/*!40000 ALTER TABLE `song collaborators` DISABLE KEYS */;
/*!40000 ALTER TABLE `song collaborators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `songs`
--

DROP TABLE IF EXISTS `songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `songs` (
  `song_id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) NOT NULL,
  `musician_id` int unsigned DEFAULT NULL,
  `upload_date` datetime NOT NULL,
  `genre` varchar(50) DEFAULT NULL,
  `duration` int NOT NULL,
  `file_url` varchar(2000) NOT NULL,
  `cover_art_url` varchar(2000) DEFAULT NULL,
  `description` text,
  `views` int unsigned DEFAULT '0',
  PRIMARY KEY (`song_id`),
  KEY `songs_musician_id_foreign` (`musician_id`),
  CONSTRAINT `songs_musician_id_foreign` FOREIGN KEY (`musician_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `songs`
--

LOCK TABLES `songs` WRITE;
/*!40000 ALTER TABLE `songs` DISABLE KEYS */;
/*!40000 ALTER TABLE `songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `streaming history`
--

DROP TABLE IF EXISTS `streaming history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `streaming history` (
  `stream_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `song_id` int unsigned NOT NULL,
  `timestamp` datetime NOT NULL,
  `duration_listened` int DEFAULT NULL,
  PRIMARY KEY (`stream_id`),
  KEY `streaming_history_user_id_foreign` (`user_id`),
  KEY `streaming_history_song_id_foreign` (`song_id`),
  CONSTRAINT `streaming_history_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE,
  CONSTRAINT `streaming_history_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `streaming history`
--

LOCK TABLES `streaming history` WRITE;
/*!40000 ALTER TABLE `streaming history` DISABLE KEYS */;
/*!40000 ALTER TABLE `streaming history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user followers`
--

DROP TABLE IF EXISTS `user followers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user followers` (
  `follower_id` int unsigned NOT NULL,
  `followed_id` int unsigned NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`follower_id`,`followed_id`),
  KEY `user_followers_followed_id_foreign` (`followed_id`),
  CONSTRAINT `user_followers_followed_id_foreign` FOREIGN KEY (`followed_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_followers_follower_id_foreign` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user followers`
--

LOCK TABLES `user followers` WRITE;
/*!40000 ALTER TABLE `user followers` DISABLE KEYS */;
/*!40000 ALTER TABLE `user followers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `name` varchar(100) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `account_type` enum('Listener','Musician') NOT NULL DEFAULT 'Listener',
  `registration_date` datetime NOT NULL,
  `profile_picture_url` varchar(2000) DEFAULT NULL,
  `bio` text,
  `monthly_listeners` bigint DEFAULT NULL,
  `uh_affiliation` enum('Student','Alumni','Staff','None') NOT NULL DEFAULT 'None',
  `verification_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'True if verified, False if unverified',
  `admin_role` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'true = admin, false = regular user',
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `clerk_user_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `new_user_id` (`user_id`),
  UNIQUE KEY `clerk_user_id` (`clerk_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-03 15:44:52
