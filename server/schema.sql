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
-- Table structure for table `comments`
--

/* 

current dbs schema deletes on cascade for foreign keys, 
so if a user is deleted, all their comments, likes, and streaming history 
are deleted as well.



*/ 








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
  KEY `comments_song_id_foreign` (`song_id`),
  KEY `comments_user_id_foreign` (`user_id`),
  CONSTRAINT `comments_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`),
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
  KEY `likes_song_id_foreign` (`song_id`),
  KEY `likes_user_id_foreign` (`user_id`),
  CONSTRAINT `likes_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`),
  CONSTRAINT `likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  KEY `song_id` (`song_id`),
  CONSTRAINT `playlist songs_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`playlist_id`),
  CONSTRAINT `playlist songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  CONSTRAINT `song collaborators_ibfk_1` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`)
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
  PRIMARY KEY (`song_id`),
  KEY `songs_musician_id_foreign` (`musician_id`),
  CONSTRAINT `songs_musician_id_foreign` FOREIGN KEY (`musician_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `songs`
--

LOCK TABLES `songs` WRITE;
/*!40000 ALTER TABLE `songs` DISABLE KEYS */;
INSERT INTO `songs` VALUES (1,'Love Sosa',6,'2025-03-06 02:46:02','Hip-Hop',300,'https://coogsmusicstorage.blob.core.windows.net/songs/Chief Keef - Love Sosa.mp3','https://via.placeholder.com/150','Chief Keef - Love Sosa test upload.'),(3,'test',6,'2025-03-06 07:07:16','Unknown',200,'https://coogsmusicstorage.blob.core.windows.net/songs/e4c06b48-fa14-4c99-8c06-460b94f4fa09-uploaded-song.mp3',NULL,'test'),(4,'test',6,'2025-03-06 07:15:10','Unknown',200,'https://coogsmusicstorage.blob.core.windows.net/songs/830387da-5d2e-411b-b09c-6aa50f26b0bb-uploaded-song.mp3',NULL,'test'),(5,'milli',6,'2025-03-06 07:18:29','Unknown',200,'https://coogsmusicstorage.blob.core.windows.net/songs/d7f6c867-7439-48aa-80cd-82b9ab9e2988-uploaded-song.mp3',NULL,'lilwayne'),(6,'anothertest',6,'2025-03-06 07:25:10','Unknown',200,'https://coogsmusicstorage.blob.core.windows.net/songs/647acd54-51c6-4182-a1e0-2eacefb681fc-uploaded-song.mp3',NULL,'anothertest'),(7,'anothertest',6,'2025-03-06 12:46:45','Unknown',200,'https://coogsmusicstorage.blob.core.windows.net/songs/103b3af9-85ab-4827-99cf-cb7daf397b41-uploaded-song.mp3',NULL,'Test by adem before merge with main'),(8,'a milli',6,'2025-03-06 23:32:14','lil wayne',180,'https://coogsmusicstorage.blob.core.windows.net/songs/e8abfbbf-06f9-4472-b070-67fde55c474d-A%20Milli.mp3','a','a'),(9,'hate being sober',6,'2025-03-06 23:39:50','rap',180,'https://coogsmusicstorage.blob.core.windows.net/songs/af0bf23e-6005-4ac9-ad73-1eedd046e457-Hate%20Bein%27%20Sober.mp3','n/a','best song ever'),(10,'LebronJamesSong',8,'2025-03-22 15:33:12','test',180,'https://coogsmusicstorage.blob.core.windows.net/songs/40511fe4-0a4b-4bd0-99d1-d6e3acfe241b-lebronjamessongtest.mp3','https://via.placeholder.com/150','test');
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
  KEY `streaming_history_song_id_foreign` (`song_id`),
  KEY `streaming_history_user_id_foreign` (`user_id`),
  CONSTRAINT `streaming_history_song_id_foreign` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`),
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--
