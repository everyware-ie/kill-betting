package com.killnagi.domain.scoreboard.dto;

public record TeamUpdate(
        Long teamId,
        String teamName,
        int matchKillDelta,
        int totalEffectiveKills,
        int totalBonusKills,
        int totalPenaltyKills
) {}
