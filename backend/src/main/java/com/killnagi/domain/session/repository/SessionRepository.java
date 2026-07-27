package com.killnagi.domain.session.repository;

import com.killnagi.domain.session.entity.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findByHostId(Long hostId);

    @Query("SELECT s FROM Session s WHERE s.host.id = :userId OR EXISTS " +
           "(SELECT su FROM SessionUser su WHERE su.session.id = s.id AND su.user.id = :userId)")
    List<Session> findSessionsByUserId(@Param("userId") Long userId);

    Optional<Session> findByIdAndStatus(Long id, Session.SessionStatus status);

    Optional<Session> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    List<Session> findByStatus(Session.SessionStatus status);

    long countByStatus(Session.SessionStatus status);

    List<Session> findByStatusAndTimeLimitMinutesIsNotNull(Session.SessionStatus status);

    // 어드민 세션 목록: host를 함께 fetch(N+1 방지). ManyToOne fetch join이라 페이징 안전.
    @Query(value = "SELECT s FROM Session s JOIN FETCH s.host",
           countQuery = "SELECT COUNT(s) FROM Session s")
    Page<Session> findAllWithHost(Pageable pageable);

    @Query(value = "SELECT s FROM Session s JOIN FETCH s.host WHERE s.status = :status",
           countQuery = "SELECT COUNT(s) FROM Session s WHERE s.status = :status")
    Page<Session> findByStatusWithHost(@Param("status") Session.SessionStatus status, Pageable pageable);
}
