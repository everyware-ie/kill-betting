package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.event.MatchDeletedEvent;
import com.killnagi.domain.match.event.MemberSnapshot;
import com.killnagi.domain.match.event.TeamSnapshot;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.team.entity.TeamPlayer;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchDeleteService {

    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void delete(Long matchId, Long requesterId) {
        Match match = findValidMatch(matchId);
        validateTeamLeaderPermission(match, requesterId);
        validateSessionInProgress(match);

        List<MatchResult> results = matchResultRepository.findByMatch(match);
        match.delete(results);

        eventPublisher.publishEvent(buildEvent(match, results));
    }

    private Match findValidMatch(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> KillnagiException.notFound("매치를 찾을 수 없습니다."));
    }

    private void validateTeamLeaderPermission(Match match, Long requesterId) {
        if (!match.getTeam().isLedBy(requesterId)) {
            throw KillnagiException.forbidden("해당 팀의 리더만 매치를 삭제할 수 있습니다.");
        }
    }

    private void validateSessionInProgress(Match match) {
        if (!match.getSession().isInProgress()) {
            throw KillnagiException.badRequest("진행 중인 세션의 매치만 삭제할 수 있습니다.");
        }
    }

    private MatchDeletedEvent buildEvent(Match match, List<MatchResult> results) {
        return new MatchDeletedEvent(
                match.getId(), match.getSession().getId(), match.getMatchNumber(),
                match.getMapName(), LocalDateTime.now(),
                buildTeamSnapshot(match),
                buildMemberSnapshots(results));
    }

    private TeamSnapshot buildTeamSnapshot(Match match) {
        return new TeamSnapshot(
                match.getTeam().getId(), match.getTeam().getName(), -match.getMatchKillCount(),
                match.getTeam().getEffectiveKills(), match.getMatchBonusScore(), match.getMatchPenaltyScore());
    }

    private List<MemberSnapshot> buildMemberSnapshots(List<MatchResult> results) {
        return results.stream().map(this::toMemberSnapshot).toList();
    }

    private MemberSnapshot toMemberSnapshot(MatchResult result) {
        TeamPlayer player = result.getTeamPlayer();
        return new MemberSnapshot(
                player.getId(), player.getPlayerNickname(),
                -result.getKills(),
                player.getBonusKills(), player.getPenaltyKills(),
                -result.getKills(),
                player.getEffectiveKills());
    }
}