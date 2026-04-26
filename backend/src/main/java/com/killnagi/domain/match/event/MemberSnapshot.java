package com.killnagi.domain.match.event;

public record MemberSnapshot(
        Long memberId,
        String nickname,
        int kills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills,
        int cumulativeTotalKills
) {}
