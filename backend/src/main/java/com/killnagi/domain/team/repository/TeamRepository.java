package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySessionId(Long sessionId);
    Optional<Team> findByIdAndSessionId(Long teamId, Long sessionId);
    boolean existsBySessionIdAndOperatorUserId(Long sessionId, Long operatorUserId);
    boolean existsBySessionIdAndOperatorUserIdAndIdNot(Long sessionId, Long operatorUserId, Long teamId);
    java.util.Optional<Team> findBySessionIdAndOperatorUserId(Long sessionId, Long operatorUserId);
}
