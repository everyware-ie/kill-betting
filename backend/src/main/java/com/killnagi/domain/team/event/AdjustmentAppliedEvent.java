package com.killnagi.domain.team.event;

public record AdjustmentAppliedEvent(
        Long sessionId,
        Long teamId,
        String teamName,
        int amount,
        String reason
) {}
