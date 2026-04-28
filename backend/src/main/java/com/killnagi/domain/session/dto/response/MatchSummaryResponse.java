package com.killnagi.domain.session.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record MatchSummaryResponse(
        Long matchId,
        int matchNumber,
        String mapName,
        String screenshotUrl,
        LocalDateTime playedAt,
        List<MemberMatchResultResponse> memberResults
) {}