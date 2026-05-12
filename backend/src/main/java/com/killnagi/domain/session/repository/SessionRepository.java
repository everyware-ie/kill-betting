package com.killnagi.domain.session.repository;

import com.killnagi.domain.session.entity.Session;
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
}
