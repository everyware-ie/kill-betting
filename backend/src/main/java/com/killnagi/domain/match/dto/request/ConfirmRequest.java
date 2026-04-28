package com.killnagi.domain.match.dto.request;

import java.util.List;

public record ConfirmRequest(List<PlayerTopStatus> playerResults) {
    public record PlayerTopStatus(Long matchResultId, boolean isTop10) {}
}
