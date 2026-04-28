package com.killnagi.domain.session.dto.response;

public record MemberMatchResultResponse(
        Long playerId,
        Long teamId,
        String teamName,
        String playerNickname,
        int kills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills,
        Integer placement,
        boolean isChicken
) {}
