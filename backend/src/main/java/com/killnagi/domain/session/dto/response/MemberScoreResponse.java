package com.killnagi.domain.session.dto.response;

public record MemberScoreResponse(
        Long playerId,
        String playerNickname,
        int totalKills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills
) {}
