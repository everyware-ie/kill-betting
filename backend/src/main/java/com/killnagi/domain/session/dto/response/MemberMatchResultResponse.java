package com.killnagi.domain.session.dto.response;

public record MemberMatchResultResponse(
        Long memberId,
        Long teamId,
        String teamName,
        String nickname,
        int kills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills,
        Integer placement,
        boolean isChicken
) {}