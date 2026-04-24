package com.killnagi.domain.match.repository;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByMatch(Match match);
}
