package com.killnagi.domain.session.event;

public record SessionEndEvent(
        Long sessionId,
        Long winnerTeamId,
        String winnerTeamName,
        SessionEndReason reason
) {
    public boolean isDraw() {
        return winnerTeamId == null;
    }
}