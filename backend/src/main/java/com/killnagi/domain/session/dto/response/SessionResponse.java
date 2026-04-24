package com.killnagi.domain.session.dto.response;

import java.time.LocalDateTime;

import com.killnagi.domain.session.entity.Session.SessionStatus;

public record SessionResponse(
        Long id,
        String name,
        String hostNickname,
        SessionStatus status,
        Integer targetKills,
        Integer timeLimitMinutes,
        LocalDateTime createdAt
) {}
