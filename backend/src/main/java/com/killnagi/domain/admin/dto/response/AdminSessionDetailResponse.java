package com.killnagi.domain.admin.dto.response;

import java.util.List;

import com.killnagi.domain.session.dto.response.MatchHistoryResponse;
import com.killnagi.domain.session.dto.response.ScoreboardResponse;
import com.killnagi.domain.team.dto.response.TeamResponse;

public record AdminSessionDetailResponse(
        AdminSessionMetaResponse meta,
        List<TeamResponse> teams,
        MatchHistoryResponse matchHistory,
        ScoreboardResponse scoreboard
) {
}