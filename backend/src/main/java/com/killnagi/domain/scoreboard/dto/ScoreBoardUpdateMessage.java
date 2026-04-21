package com.killnagi.domain.scoreboard.dto;

import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.match.event.MemberSnapshot;
import com.killnagi.domain.match.event.TeamSnapshot;

import java.time.LocalDateTime;
import java.util.List;

public record ScoreBoardUpdateMessage(
        Long matchId,
        Long sessionId,
        int matchNumber,
        String mapName,
        LocalDateTime registeredAt,
        TeamUpdate teamUpdate,
        List<MemberResult> memberResults
) {

    public static ScoreBoardUpdateMessage from(MatchConfirmedEvent event) {
        TeamUpdate teamUpdate = toTeamUpdate(event.teamSnapshot());
        List<MemberResult> memberResults = event.memberSnapshots().stream()
                .map(ScoreBoardUpdateMessage::toMemberResult)
                .toList();

        return new ScoreBoardUpdateMessage(
                event.matchId(),
                event.sessionId(),
                event.matchNumber(),
                event.mapName(),
                event.registeredAt(),
                teamUpdate,
                memberResults
        );
    }

    private static TeamUpdate toTeamUpdate(TeamSnapshot snapshot) {
        return new TeamUpdate(
                snapshot.teamId(),
                snapshot.teamName(),
                snapshot.matchKillDelta(),
                snapshot.totalEffectiveKills(),
                snapshot.totalBonusKills(),
                snapshot.totalPenaltyKills()
        );
    }

    private static MemberResult toMemberResult(MemberSnapshot snapshot) {
        return new MemberResult(
                snapshot.memberId(),
                snapshot.nickname(),
                snapshot.kills(),
                snapshot.bonusKills(),
                snapshot.penaltyKills(),
                snapshot.effectiveKills(),
                snapshot.cumulativeTotalKills()
        );
    }
}
