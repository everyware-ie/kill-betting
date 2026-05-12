package com.killnagi.domain.session.dto.response;

import java.util.List;

import com.killnagi.domain.session.entity.Session.SessionStatus;

public record ScoreboardResponse(
        Long sessionId,
        String sessionName,
        SessionStatus status,
        Long winnerTeamId,
        String winnerTeamName,
        boolean isDraw,
        List<TeamScoreResponse> teams
) {
}
