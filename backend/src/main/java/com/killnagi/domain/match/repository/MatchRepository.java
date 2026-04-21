package com.killnagi.domain.match.repository;

import com.killnagi.domain.match.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findBySessionIdOrderByMatchNumberAsc(Long sessionId);

    int countBySessionId(Long sessionId);

    // 확정된 매치와 팀원 결과를 한 번에 조회 (N+1 방지)
    @Query("SELECT DISTINCT m FROM Match m " +
           "JOIN FETCH m.results r " +
           "JOIN FETCH r.teamMember tm " +
           "JOIN FETCH tm.user " +
           "JOIN FETCH tm.team " +
           "WHERE m.session.id = :sessionId AND m.status = :status " +
           "ORDER BY m.matchNumber ASC")
    List<Match> findConfirmedMatchesWithResults(
            @Param("sessionId") Long sessionId,
            @Param("status") Match.MatchStatus status
    );
}
