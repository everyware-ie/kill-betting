package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.entity.Session;
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
        LocalDateTime createdAt,
        LocalDateTime startedAt
) {
    public static SessionDetailResponse from(Session session, List<RuleResponse> rules) {
        return new SessionDetailResponse(
                session.getId(),
                session.getName(),
                session.getRoomCode(),
                session.getStatus(),
                session.getHost().getId(),
                session.getHostNickname(),
                session.getTargetKills(),
                session.getTimeLimitMinutes(),
                rules,
                session.getCreatedAt(),
                session.getStartedAt()
        );
    }
}