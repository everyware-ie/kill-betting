package com.killnagi.domain.session.repository;

import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessionUserRepository extends JpaRepository<SessionUser, Long> {
    boolean existsBySession_IdAndUser_Id(Long sessionId, Long userId);
    Optional<SessionUser> findBySession_IdAndUser_Id(Long sessionId, Long userId);
    List<SessionUser> findBySession_IdAndStatus(Long sessionId, SessionUserStatus status);
    void deleteBySession_IdAndUser_Id(Long sessionId, Long userId);
}
