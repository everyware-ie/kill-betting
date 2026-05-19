package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.team.entity.Team;

import java.util.List;

public record TeamScoreResponse(
        Long teamId,
        String teamName,
        int totalKills,
        int ruleScore,
        int adjustmentScore,
        int effectiveKills,
        List<MemberScoreResponse> members
) {
    public static TeamScoreResponse from(Team team) {
        List<MemberScoreResponse> members = team.getPlayers().stream()
                .map(MemberScoreResponse::from)
                .toList();
        return new TeamScoreResponse(
                team.getId(),
                team.getName(),
                team.getTotalKills(),
                team.getRuleScore(),
                team.getAdjustmentScore(),
                team.getEffectiveKills(),
                members
        );
    }
}
