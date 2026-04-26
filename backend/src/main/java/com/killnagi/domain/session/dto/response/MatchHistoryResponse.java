package com.killnagi.domain.session.dto.response;

import java.util.List;

public record MatchHistoryResponse(
        Long sessionId,
        String sessionName,
        int confirmedMatchCount,
        List<MatchSummaryResponse> matches
) {}