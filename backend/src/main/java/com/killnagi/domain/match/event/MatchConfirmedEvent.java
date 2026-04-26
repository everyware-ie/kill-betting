package com.killnagi.domain.match.event;

import java.time.LocalDateTime;
import java.util.List;

public record MatchConfirmedEvent(
        Long matchId,
        Long sessionId,
        int matchNumber,
        String mapName,
        LocalDateTime registeredAt,
        TeamSnapshot teamSnapshot,
        List<MemberSnapshot> memberSnapshots
) {}
