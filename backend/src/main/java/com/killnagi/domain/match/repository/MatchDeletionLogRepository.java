package com.killnagi.domain.match.repository;

import com.killnagi.domain.match.entity.MatchDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchDeletionLogRepository extends JpaRepository<MatchDeletionLog, Long> {
}