package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchConfirmService {

    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final RuleRepository ruleRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public ConfirmResponse confirm(Long matchId, Long requesterId, ConfirmRequest request) {
        Match match = findValidMatch(matchId);
        validateLeaderPermission(match.getSession().getId(), requesterId);
        List<MatchResult> results = findConfirmableResults(match);

        Map<Long, Boolean> top10Map = request.playerResults().stream()
                .collect(Collectors.toMap(ConfirmRequest.PlayerTopStatus::matchResultId,
                        ConfirmRequest.PlayerTopStatus::isTop10));

        List<Rule> rules = ruleRepository.findByRuleSetSessionIdAndEnabled(match.getSession().getId(), true);
        applyResults(results, rules, top10Map);

        match.confirm();
        return new ConfirmResponse(matchId, match.getStatus().name());
    }

    private Match findValidMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> KillnagiException.notFound("매치를 찾을 수 없습니다."));

        if (match.isConfirmed()) {
            throw KillnagiException.badRequest("이미 확정된 매치입니다.");
        }

        if (!match.isConfirmable()) {
            throw KillnagiException.badRequest("확정할 수 없는 상태의 매치입니다.");
        }
        return match;
    }

    private List<MatchResult> findConfirmableResults(Match match) {
        List<MatchResult> results = matchResultRepository.findByMatch(match);
        if (results.isEmpty()) {
            throw KillnagiException.badRequest("확정할 매치 결과가 없습니다.");
        }

        return results;
    }

    private void validateLeaderPermission(Long sessionId, Long requesterId) {
        if (!teamRepository.existsBySessionIdAndLeader_Id(sessionId, requesterId)) {
            throw KillnagiException.forbidden("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
        }
    }

    private void applyResults(List<MatchResult> results, List<Rule> rules, Map<Long, Boolean> top10Map) {
        results.stream()
                .collect(Collectors.groupingBy(r -> r.getTeamPlayer().getTeam()))
                .forEach((team, teamResults) -> applyTeamResults(team, teamResults, rules, top10Map));
    }

    private void applyTeamResults(Team team, List<MatchResult> teamResults, List<Rule> rules, Map<Long, Boolean> top10Map) {
        int teamKills = teamResults.stream().mapToInt(MatchResult::getKills).sum();
        team.addKills(teamKills);

        teamResults.forEach(r -> r.getTeamPlayer().addKills(r.getKills()));

        boolean isChicken = teamResults.stream().anyMatch(MatchResult::isChicken);
        long failedTop10Count = teamResults.stream()
                .filter(r -> !top10Map.getOrDefault(r.getId(), true))
                .count();

        for (Rule rule : rules) {
            switch (rule.getRuleType()) {
                case CHICKEN_BONUS -> {
                    if (isChicken) team.addBonus(rule.getValue());
                }
                case SURVIVAL_PENALTY -> {
                    if (failedTop10Count > 0) team.addPenalty((int) failedTop10Count * rule.getValue());
                }
            }
        }
    }
}
