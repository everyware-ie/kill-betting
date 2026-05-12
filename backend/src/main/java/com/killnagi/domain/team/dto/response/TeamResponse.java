package com.killnagi.domain.team.dto.response;

import java.util.List;

public record TeamResponse(
        Long id,
        String name,
        Long leaderUserId,
        int effectiveKills,
        List<MemberResponse> members,
        List<String> players
) {

    public record MemberResponse(
            Long userId,
            String username,
            String role
    ) {}
}