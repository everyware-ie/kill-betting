package com.killnagi.domain.match.repository;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findBySessionIdOrderByMatchNumberAsc(Long sessionId);

    int countBySessionId(Long sessionId);

    List<Match> findBySessionIdAndStatusOrderByMatchNumberAsc(Long sessionId, MatchStatus status);
}
