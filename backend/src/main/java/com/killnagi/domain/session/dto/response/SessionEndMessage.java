package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.session.event.SessionEndEvent;
import com.killnagi.domain.session.event.SessionEndReason;

public record SessionEndMessage(
        Long sessionId,
        Long winnerTeamId,
        String winnerTeamName,
        SessionEndReason reason,
        boolean isDraw
) {
    public static SessionEndMessage from(SessionEndEvent event) {
        return new SessionEndMessage(
                event.sessionId(),
                event.winnerTeamId(),
                event.winnerTeamName(),
                event.reason(),
                event.isDraw());
    }
}