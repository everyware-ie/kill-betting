package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.request.ConfirmRequest.PlayerResult;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.Match.MatchConfirmData;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.event.MatchConfirmedEvent;
import com.killnagi.domain.match.event.MemberSnapshot;
import com.killnagi.domain.match.event.TeamSnapshot;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.service.SessionEndService;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchConfirmService {

    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final TeamPlayerRepository teamPlayerRepository;
    private final RuleRepository ruleRepository;
    private final TeamRepository teamRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final SessionEndService sessionEndService;
    private final MeterRegistry meterRegistry;

    @Transactional
    public ConfirmResponse confirm(Long matchId, Long requesterId, ConfirmRequest request) {
        Match match = findValidMatch(matchId);
        validateLeaderPermission(match.getSession().getId(), requesterId);

        List<MatchResult> results = createAndSaveMatchResults(match, request.playerResults());

        List<Rule> rules = ruleRepository.findByRuleSetSessionIdAndEnabled(match.getSession().getId(), true);
        MatchConfirmData confirmData = new MatchConfirmData(
                request.isChicken(), request.mapName(), request.placement(), request.playTime());
        match.confirm(results, rules, confirmData);
        match.getSession().touchLastMatch(LocalDateTime.now());

        meterRegistry.counter("match.confirmed").increment();
        eventPublisher.publishEvent(buildEvent(match, results));
        checkKillLimit(match);
        return new ConfirmResponse(matchId, match.getStatus().name());
    }

    private MatchConfirmedEvent buildEvent(Match match, List<MatchResult> results) {
        return new MatchConfirmedEvent(
                match.getId(), match.getSession().getId(), match.getMatchNumber(),
                match.getMapName(), LocalDateTime.now(),
                buildTeamSnapshot(match),
                buildMemberSnapshots(results));
    }

    private TeamSnapshot buildTeamSnapshot(Match match) {
        return new TeamSnapshot(
                match.getTeam().getId(), match.getTeam().getName(), match.getMatchKillCount(),
                match.getTeam().getEffectiveKills(), match.getMatchBonusScore(), match.getMatchPenaltyScore());
    }

    private List<MemberSnapshot> buildMemberSnapshots(List<MatchResult> results) {
        return results.stream().map(this::toMemberSnapshot).toList();
    }

    private MemberSnapshot toMemberSnapshot(MatchResult result) {
        TeamPlayer player = result.getTeamPlayer();
        return new MemberSnapshot(
                player.getId(), player.getPlayerNickname(),
                result.getKills(),
                player.getBonusKills(), player.getPenaltyKills(),
                result.getKills(),
                player.getEffectiveKills());
    }

    private void checkKillLimit(Match match) {
        Session session = match.getSession();
        if (session.hasKillLimit() && match.getTeam().getEffectiveKills() >= session.getTargetKills()) {
            sessionEndService.endByKillLimit(session, match.getTeam());
        }
    }

    private Match findValidMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> KillnagiException.notFound("매치를 찾을 수 없습니다."));

        if (match.isConfirmed()) {
            throw KillnagiException.badRequest("이미 확정된 매치입니다.");
        }
        return match;
    }

    private void validateLeaderPermission(Long sessionId, Long requesterId) {
        if (!teamRepository.existsBySessionIdAndLeader_Id(sessionId, requesterId)) {
            throw KillnagiException.forbidden("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
        }
    }

    private List<MatchResult> createAndSaveMatchResults(Match match, List<PlayerResult> playerResults) {
        List<TeamPlayer> remainingPlayers = new ArrayList<>(teamPlayerRepository.findByTeam_Id(match.getTeam().getId()));
        List<MatchResult> matchResults = new ArrayList<>();

        playerResults.forEach(playerResult -> matchResults.add(mapToMatchResult(match, remainingPlayers, playerResult)));

        if (!remainingPlayers.isEmpty()) {
            throw KillnagiException.badRequest("결과가 입력되지 않은 팀원이 있습니다.");
        }

        return matchResultRepository.saveAll(matchResults);
    }

    private MatchResult mapToMatchResult(Match match, List<TeamPlayer> remainingPlayers, PlayerResult playerResult) {
        TeamPlayer teamPlayer = remainingPlayers.stream()
                .filter(player -> player.hasNickname(playerResult.nickname()))
                .findFirst()
                .orElseThrow(() -> KillnagiException.badRequest(playerResult.nickname() + "은(는) 팀원이 아닙니다."));
        remainingPlayers.remove(teamPlayer);
        return playerResult.toMatchResult(match, teamPlayer);
    }
}
