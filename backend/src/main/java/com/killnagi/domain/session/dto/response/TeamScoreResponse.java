package com.killnagi.domain.session.dto.response;

import java.util.List;

public record TeamScoreResponse(
        Long teamId,
        String teamName,
        int totalKills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills,
        List<MemberScoreResponse> members
) {}
