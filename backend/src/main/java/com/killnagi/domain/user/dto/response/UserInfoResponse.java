package com.killnagi.domain.user.dto.response;

public record UserInfoResponse(
        Long id,
        String nickname,
        String email,
        String pubgNickname,
        int totalSessions,
        int wins,
        int losses,
        double winRate
) {}
