package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    boolean existsByTeam_Session_IdAndUserId(Long sessionId, Long userId);
    boolean existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(Long sessionId, Long userId);
}
