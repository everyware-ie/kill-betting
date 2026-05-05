package com.killnagi.domain.session.dto.response;

public record SessionMessage(Type type, Object data) {

    public enum Type {
        PARTICIPANT_UPDATED,
        SCORE_UPDATED,
        MATCH_RESULT
    }
}