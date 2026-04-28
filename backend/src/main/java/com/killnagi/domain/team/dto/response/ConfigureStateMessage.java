package com.killnagi.domain.team.dto.response;

import java.util.List;

public record ConfigureStateMessage(
        Long sessionId,
        List<WaitingUserInfo> waitingUsers,
        List<TeamConfigureInfo> teams
) {
    public record WaitingUserInfo(Long userId, String nickname) {}

    public record TeamConfigureInfo(
            Long teamId,
            String teamName,
            String status,
            Long operatorUserId,
            String operatorNickname,
            List<PlayerInfo> players
    ) {}

    public record PlayerInfo(Long playerId, String playerNickname) {}
}
