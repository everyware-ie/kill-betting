package com.killnagi.domain.admin.dto.response;

import java.time.LocalDateTime;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;

public record AdminSessionMetaResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        String roomCode,
        Integer targetKills,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        LocalDateTime startedAt,
        LocalDateTime endedAt
) {
    public static AdminSessionMetaResponse from(Session session) {
        return new AdminSessionMetaResponse(
                session.getId(),
                session.getName(),
                session.getHost().getNickname(),
                session.getStatus(),
                session.getRoomCode(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getEndedAt()
        );
    }
}