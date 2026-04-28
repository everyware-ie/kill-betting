package com.killnagi.domain.match.repository;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findBySessionIdOrderByMatchNumberAsc(Long sessionId);

    int countBySessionId(Long sessionId);

    @Query("SELECT DISTINCT m FROM Match m " +
           "JOIN FETCH m.results r " +
           "JOIN FETCH r.teamPlayer tp " +
           "JOIN FETCH tp.team " +
           "WHERE m.session.id = :sessionId AND m.status = :status " +
           "ORDER BY m.matchNumber ASC")
    List<Match> findConfirmedMatchesWithResults(
            @Param("sessionId") Long sessionId,
            @Param("status") MatchStatus status
    );
}
