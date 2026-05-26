package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySessionId(Long sessionId);
    Optional<Team> findByIdAndSessionId(Long teamId, Long sessionId);
    boolean existsBySessionIdAndLeader_Id(Long sessionId, Long leaderUserId);
    boolean existsBySessionIdAndLeader_IdAndIdNot(Long sessionId, Long leaderUserId, Long teamId);
    Optional<Team> findBySessionIdAndLeader_Id(Long sessionId, Long leaderUserId);

    @Query("SELECT t.session.id FROM Team t WHERE t.leader.id = :userId")
    Set<Long> findSessionIdsByLeaderUserId(@Param("userId") Long userId);
}
