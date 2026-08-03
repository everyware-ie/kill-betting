package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.match.entity.Match;

import java.time.LocalDateTime;
import java.util.List;

public record MatchSummaryResponse(
        Long matchId,
        int matchNumber,
        String mapName,
        String screenshotUrl,
        LocalDateTime playedAt,
        Long teamId,
        String teamName,
        List<MemberMatchResultResponse> memberResults
) {
    public static MatchSummaryResponse from(Match match, List<MemberMatchResultResponse> memberResults) {
        return new MatchSummaryResponse(
                match.getId(),
                match.getMatchNumber(),
                match.getMapName(),
                match.getScreenshotUrl(),
                match.getCreatedAt(),
                match.getTeam().getId(),
                match.getTeam().getName(),
                memberResults
        );
    }
}