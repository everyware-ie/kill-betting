ALTER TABLE `sessions`
  ADD COLUMN `last_match_at` datetime(6) DEFAULT NULL,
  ADD COLUMN `deleted_at` datetime(6) DEFAULT NULL;
