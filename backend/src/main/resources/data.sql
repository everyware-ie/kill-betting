SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO `users` VALUES
  (1,'2026-04-30 14:25:48.248384','jm@naver.com',0,'jm','$2a$10$XqDMn6ySY0.x.Duyo6qO3utm22vSh50D8QI8/BDP0Sh56dq32z0Xy',NULL,NULL,0,'2026-04-30 14:25:48.248384',0),
  (2,'2026-04-30 14:27:40.010492','je@naver.com',0,'je','$2a$10$gQO7.HU97ehYDx9nthOoDOjZ.G/OhmYlU9O.gkLck0/tE11cK6VIq',NULL,NULL,0,'2026-04-30 14:27:40.010492',0),
  (3,'2026-04-30 14:35:29.010960','hs@naver.com',0,'hs','$2a$10$olow1YKgrJXvSgO0Im64/O4hpGYK9fakukFqdBAkiJZnWHipadqQK',NULL,NULL,0,'2026-04-30 14:35:29.010960',0);

INSERT IGNORE INTO `sessions` (id, created_at, updated_at, name, room_url, room_code, status, target_kills, time_limit_minutes, started_at, host_user_id, current_rule_set_id, winner_team_id) VALUES
  (1,'2026-04-30 14:30:18.985300','2026-04-30 15:06:19.999238','방','6a94e657-4787-4fc6-a8fe-00e4ef50fbed','6A94E6','IN_PROGRESS',20,60,'2026-04-30 15:06:19.999466',1,1,NULL);

INSERT IGNORE INTO `rule_sets` VALUES
  (1,'2026-04-30 14:30:19.000690',1);

INSERT IGNORE INTO `rules` VALUES
  (1,b'1','PLUS','CHICKEN_BONUS',1,1);

INSERT IGNORE INTO `teams` (id, total_kills, name, rule_score, leader_user_id, session_id) VALUES
  (1, 0, '팀1', 0, 2, 1),
  (2, 0, '팀2', 0, 3, 1);

INSERT IGNORE INTO `team_players` VALUES
  (1,0,'2026-04-30 15:05:01.507932',0,'JEONCHMDAN',0,'2026-04-30 15:05:01.507932',1),
  (2,0,'2026-04-30 15:05:22.016957',0,'segwonbogi',0,'2026-04-30 15:05:22.016957',1),
  (3,0,'2026-04-30 15:05:31.091249',0,'SegwOn',0,'2026-04-30 15:05:31.091249',1),
  (4,0,'2026-04-30 15:05:37.296320',0,'Jeongw00k',0,'2026-04-30 15:05:37.296320',1),
  (5,0,'2026-04-30 15:05:59.680574',0,'jmjm',0,'2026-04-30 15:05:59.680574',2),
  (6,0,'2026-04-30 15:06:03.097534',0,'haha',0,'2026-04-30 15:06:03.097534',2);

INSERT IGNORE INTO `session_users` VALUES
  (1,'2026-04-30 14:33:38.803916','ACTIVE',1,2),
  (2,'2026-04-30 14:36:17.242144','ACTIVE',1,3);

SET FOREIGN_KEY_CHECKS = 1;