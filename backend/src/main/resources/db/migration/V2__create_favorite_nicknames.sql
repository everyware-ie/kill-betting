CREATE TABLE IF NOT EXISTS `favorite_nicknames` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_favorite_nickname_user_nickname` (`user_id`,`nickname`),
  KEY `fk_favorite_nickname_user` (`user_id`),
  CONSTRAINT `fk_favorite_nickname_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
