package com.killnagi.domain.session.dto.response;

public record SessionMessage(Type type, Object data) {

    public enum Type {
        PARTICIPANT_UPDATED,
        SESSION_STARTED,
        SCORE_UPDATED,
        MATCH_RESULT,
        SESSION_ENDED,
        ADJUSTMENT_APPLIED,
        SESSION_RENEWED
    }
}