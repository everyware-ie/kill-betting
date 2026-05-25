package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;

import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        String roomCode,
        Integer targetKills,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        LocalDateTime startedAt
) {
    public static SessionResponse from(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getHostNickname(),
                session.getStatus(),
                session.getRoomCode(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt(),
                session.getStartedAt()
        );
    }
}