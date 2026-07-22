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

    // W1 리텐션 분자: 가입 후 7일이 경과한(관측 가능) 유저 중,
    // 가입일 ~ 가입일+7d 안에 세션 참여 기록이 1건 이상인 distinct 유저 수.
    @Query("""
            SELECT COUNT(DISTINCT su.user.id) FROM SessionUser su
            WHERE su.user.createdAt <= :observableCutoff
              AND su.joinedAt >= su.user.createdAt
              AND su.joinedAt <= su.user.createdAt + 7 day
            """)
    long countW1RetainedUsers(@Param("observableCutoff") LocalDateTime observableCutoff);
}
