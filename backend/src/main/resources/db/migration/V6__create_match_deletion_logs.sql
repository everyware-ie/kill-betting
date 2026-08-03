CREATE TABLE IF NOT EXISTS `match_deletion_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `match_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  `deleted_by_user_id` bigint NOT NULL,
  `reverted_kills` int NOT NULL,
  `reverted_rule_score` int NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_deletion_logs_match` (`match_id`),
  KEY `fk_match_deletion_logs_team` (`team_id`),
  KEY `fk_match_deletion_logs_user` (`deleted_by_user_id`),
  CONSTRAINT `fk_match_deletion_logs_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  CONSTRAINT `fk_match_deletion_logs_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `fk_match_deletion_logs_user` FOREIGN KEY (`deleted_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;