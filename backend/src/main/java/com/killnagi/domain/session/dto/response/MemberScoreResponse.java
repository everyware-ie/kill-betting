package com.killnagi.domain.session.dto.response;

public record MemberScoreResponse(
        Long userId,
        String nickname,
        int totalKills
) {}
