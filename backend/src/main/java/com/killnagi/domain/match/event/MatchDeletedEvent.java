package com.killnagi.domain.match.event;

import java.time.LocalDateTime;
import java.util.List;

public record MatchDeletedEvent(
        Long matchId,
        Long sessionId,
        int matchNumber,
        String mapName,
        LocalDateTime deletedAt,
        TeamSnapshot teamSnapshot,
        List<MemberSnapshot> memberSnapshots
) {}