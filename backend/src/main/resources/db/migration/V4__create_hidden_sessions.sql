CREATE TABLE IF NOT EXISTS `hidden_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `hidden_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hidden_sessions_session_user` (`session_id`,`user_id`),
  KEY `fk_hidden_sessions_user` (`user_id`),
  CONSTRAINT `fk_hidden_sessions_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`),
  CONSTRAINT `fk_hidden_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
