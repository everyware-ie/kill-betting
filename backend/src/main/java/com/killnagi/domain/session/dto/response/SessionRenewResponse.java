package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session;

public record SessionRenewResponse(
        Long sessionId,
        String roomCode,
        String name
) {
    public static SessionRenewResponse from(Session session) {
        return new SessionRenewResponse(
                session.getId(),
                session.getRoomCode(),
                session.getName()
        );
    }
}
