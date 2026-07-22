package com.killnagi.domain.session.repository;

import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessionUserRepository extends JpaRepository<SessionUser, Long> {
    boolean existsBySession_IdAndUser_Id(Long sessionId, Long userId);
    Optional<SessionUser> findBySession_IdAndUser_Id(Long sessionId, Long userId);
    List<SessionUser> findBySession_IdAndStatus(Long sessionId, SessionUserStatus status);
    void deleteBySession_IdAndUser_Id(Long sessionId, Long userId);

    long countByStatus(SessionUserStatus status);

    @Query("SELECT COUNT(DISTINCT su.user.id) FROM SessionUser su WHERE su.joinedAt > :cutoff")
    long countDistinctUsersByJoinedAtAfter(@Param("cutoff") LocalDateTime cutoff);
}
