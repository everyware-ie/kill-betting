package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session.SessionStatus;

import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        String roomUrl,
        Integer targetKills,
        Integer timeLimitMinutes,
        LocalDateTime createdAt
) {}