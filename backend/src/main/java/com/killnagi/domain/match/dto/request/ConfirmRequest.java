package com.killnagi.domain.match.dto.request;

import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.team.entity.TeamPlayer;

import java.util.List;

public record ConfirmRequest(
        String mapName,
        int placement,
        String playTime,
        List<PlayerResult> playerResults,
        boolean isChicken
) {
    public record PlayerResult(String nickname, int kills, Integer placement, boolean isTop10) {
        public MatchResult toMatchResult(Match match, TeamPlayer teamPlayer) {
            return MatchResult.builder()
                    .match(match)
                    .teamPlayer(teamPlayer)
                    .kills(kills)
                    .placement(placement)
                    .isTop10(isTop10)
                    .build();
        }
    }
}
