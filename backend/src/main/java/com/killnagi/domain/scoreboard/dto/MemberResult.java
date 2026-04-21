package com.killnagi.domain.scoreboard.dto;

public record MemberResult(
        Long memberId,
        String nickname,
        int kills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills,
        int cumulativeTotalKills
) {}
