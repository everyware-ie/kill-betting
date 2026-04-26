package com.killnagi.domain.session.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record MatchSummaryResponse(
        Long matchId,
        int matchNumber,
        String mapName,
        LocalDateTime playedAt,
        List<MemberMatchResultResponse> memberResults
) {}