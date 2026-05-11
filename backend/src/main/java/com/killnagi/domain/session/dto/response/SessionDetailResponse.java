package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session.SessionStatus;

import java.time.LocalDateTime;
import java.util.List;

public record SessionDetailResponse(
        Long id,
        String title,
        String code,
        SessionStatus status,
        Long hostUserId,
        String hostNickname,
        Integer targetKills,
        Integer timeLimitMinutes,
        List<RuleResponse> rules,
        LocalDateTime createdAt
) {}