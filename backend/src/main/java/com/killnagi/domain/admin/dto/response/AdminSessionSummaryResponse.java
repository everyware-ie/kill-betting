package com.killnagi.domain.admin.dto.response;

import java.time.LocalDateTime;

import com.killnagi.domain.session.entity.Session.SessionStatus;

public record AdminSessionSummaryResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        String roomCode,
        LocalDateTime createdAt,
        long participantCount
) {
}