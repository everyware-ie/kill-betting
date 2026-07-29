SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `losses` int NOT NULL,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pubg_nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pubg_player_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_sessions` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `wins` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_nickname` (`nickname`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `ended_at` datetime(6) DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('ENDED','IN_PROGRESS','WAITING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_kills` int DEFAULT NULL,
  `time_limit_minutes` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `current_rule_set_id` bigint DEFAULT NULL,
  `host_user_id` bigint NOT NULL,
  `winner_team_id` bigint DEFAULT NULL,
  `renewed_session_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sessions_room_code` (`room_code`),
  KEY `fk_sessions_current_rule_set` (`current_rule_set_id`),
  KEY `fk_sessions_host_user` (`host_user_id`),
  KEY `fk_sessions_winner_team` (`winner_team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_sets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `session_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rule_sets_session` (`session_id`),
  CONSTRAINT `fk_rule_sets_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enabled` bit(1) NOT NULL,
  `operator` enum('MINUS','PLUS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` enum('CHICKEN_BONUS','SURVIVAL_PENALTY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` int NOT NULL,
  `rule_set_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rules_rule_set` (`rule_set_id`),
  CONSTRAINT `fk_rules_rule_set` FOREIGN KEY (`rule_set_id`) REFERENCES `rule_sets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adjustment_score` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_score` int NOT NULL,
  `total_kills` int NOT NULL,
  `leader_user_id` bigint DEFAULT NULL,
  `session_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_teams_leader_user` (`leader_user_id`),
  KEY `fk_teams_session` (`session_id`),
  CONSTRAINT `fk_teams_leader_user` FOREIGN KEY (`leader_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_teams_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_current_rule_set` FOREIGN KEY (`current_rule_set_id`) REFERENCES `rule_sets` (`id`),
  ADD CONSTRAINT `fk_sessions_host_user` FOREIGN KEY (`host_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_sessions_winner_team` FOREIGN KEY (`winner_team_id`) REFERENCES `teams` (`id`);

CREATE TABLE `session_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','LEFT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_users_session_user` (`session_id`,`user_id`),
  KEY `fk_session_users_user` (`user_id`),
  CONSTRAINT `fk_session_users_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`),
  CONSTRAINT `fk_session_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_players` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bonus_kills` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `penalty_kills` int NOT NULL,
  `player_nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_kills` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_team_players_team` (`team_id`),
  CONSTRAINT `fk_team_players_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `matches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `failed_top10_count` bigint NOT NULL,
  `is_chicken` bit(1) NOT NULL,
  `map_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `match_bonus_score` int NOT NULL,
  `match_kill_count` int NOT NULL,
  `match_number` int NOT NULL,
  `match_penalty_score` int NOT NULL,
  `placement` int DEFAULT NULL,
  `play_time` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `screenshot_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('CONFIRMED','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` bigint NOT NULL,
  `team_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_matches_session` (`session_id`),
  KEY `fk_matches_team` (`team_id`),
  CONSTRAINT `fk_matches_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`),
  CONSTRAINT `fk_matches_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match_results` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assists` int NOT NULL,
  `damage` int NOT NULL,
  `is_top10` bit(1) NOT NULL,
  `kills` int NOT NULL,
  `match_id` bigint NOT NULL,
  `team_player_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_results_team_player` (`team_player_id`),
  KEY `fk_match_results_match` (`match_id`),
  CONSTRAINT `fk_match_results_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  CONSTRAINT `fk_match_results_team_player` FOREIGN KEY (`team_player_id`) REFERENCES `team_players` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
