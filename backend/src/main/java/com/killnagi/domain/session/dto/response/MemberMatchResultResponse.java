package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.team.entity.TeamPlayer;

public record MemberMatchResultResponse(
        Long playerId,
        Long teamId,
        String teamName,
        String playerNickname,
        int kills,
        Integer placement,
        boolean isChicken
) {
    public static MemberMatchResultResponse from(MatchResult result) {
        TeamPlayer player = result.getTeamPlayer();
        return new MemberMatchResultResponse(
                player.getId(), player.getTeamId(), player.getTeam().getName(), player.getPlayerNickname(),
                result.getKills(), result.getPlacement(), result.isChicken()
        );
    }
}
