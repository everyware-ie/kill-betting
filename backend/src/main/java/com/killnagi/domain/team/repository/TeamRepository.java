package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySessionId(Long sessionId);
    Optional<Team> findByIdAndSessionId(Long teamId, Long sessionId);
}
