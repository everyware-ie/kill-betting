package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.team.entity.TeamPlayer;

public record MemberScoreResponse(
        Long playerId,
        String playerNickname,
        int totalKills,
        int bonusKills,
        int penaltyKills,
        int effectiveKills
) {
    public static MemberScoreResponse from(TeamPlayer player) {
        return new MemberScoreResponse(
                player.getId(), 
                player.getPlayerNickname(),
                player.getTotalKills(), 
                player.getBonusKills(), 
                player.getPenaltyKills(), 
                player.getEffectiveKills()
        );
    }
}
