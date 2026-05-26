package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;

import java.time.LocalDateTime;

public record MySessionResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        String roomCode,
        Integer targetKills,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        LocalDateTime startedAt,
        SessionRole myRole
) {
    public static MySessionResponse of(Session session, SessionRole role) {
        return new MySessionResponse(
                session.getId(),
                session.getName(),
                session.getHostNickname(),
                session.getStatus(),
                session.getRoomCode(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                session.getCreatedAt(),
                session.getStartedAt(),
                role
        );
    }

    public enum SessionRole {
        HOST, LEADER, PARTICIPANT
    }
}