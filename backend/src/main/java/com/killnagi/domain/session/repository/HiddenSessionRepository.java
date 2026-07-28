package com.killnagi.domain.session.repository;

import com.killnagi.domain.session.entity.HiddenSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface HiddenSessionRepository extends JpaRepository<HiddenSession, Long> {

    @Query("SELECT h.session.id FROM HiddenSession h WHERE h.user.id = :userId")
    Set<Long> findSessionIdsByUserId(@Param("userId") Long userId);

    boolean existsBySession_IdAndUser_Id(Long sessionId, Long userId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM HiddenSession h WHERE h.session.id = :sessionId AND h.user.id = :userId")
    void deleteBySessionIdAndUserId(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}