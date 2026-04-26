package com.killnagi.domain.match.event;

public record TeamSnapshot(
        Long teamId,
        String teamName,
        int matchKillDelta,
        int totalEffectiveKills,
        int totalBonusKills,
        int totalPenaltyKills
) {}
