package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Optional<TeamMember> findByTeam_IdAndUser_Id(Long teamId, Long userId);
    Optional<TeamMember> findByTeam_SessionIdAndUser_Id(Long sessionId, Long userId);
    boolean existsByTeam_Session_IdAndUser_Id(Long sessionId, Long userId);
    boolean existsByTeam_Session_IdAndUser_IdAndIsUploaderTrue(Long sessionId, Long userId);
}
