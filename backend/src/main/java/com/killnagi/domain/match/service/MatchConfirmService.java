package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchConfirmService {

    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final RuleRepository ruleRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public ConfirmResponse confirm(Long matchId, Long requesterId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> KillnagiException.notFound("매치를 찾을 수 없습니다."));
        validateConfirmable(match);

        Long sessionId = match.getSession().getId();
        if (!teamMemberRepository.existsByTeam_Session_IdAndUserIdAndIsUploaderTrue(sessionId, requesterId)) {
            throw KillnagiException.forbidden("업로더 권한이 있는 사용자만 결과를 확정할 수 있습니다.");
        }

        List<Rule> rules = ruleRepository.findBySessionIdAndEnabled(sessionId, true);
        applyResults(match, rules);

        match.confirm();
        return new ConfirmResponse(matchId, match.getStatus().name());
    }

    private void applyResults(Match match, List<Rule> rules) {
        List<MatchResult> results = matchResultRepository.findByMatch(match);
        if (results.isEmpty()) {
            throw KillnagiException.badRequest("확정할 매치 결과가 없습니다.");
        }

        results.stream()
                .collect(Collectors.groupingBy(r -> r.getTeamMember().getTeam()))
                .forEach((team, teamResults) -> applyTeamResults(team, teamResults, rules));
    }

    private void validateConfirmable(Match match) {
        if (match.isConfirmed()) {
            throw KillnagiException.badRequest("이미 확정된 매치입니다.");
        }
        if (!match.isConfirmable()) {
            throw KillnagiException.badRequest("확정할 수 없는 상태의 매치입니다.");
        }
    }

    private void applyTeamResults(Team team, List<MatchResult> teamResults, List<Rule> rules) {
        int teamKills = teamResults.stream().mapToInt(MatchResult::getKills).sum();
        team.addKills(teamKills);

        teamResults.forEach(r -> r.getTeamMember().addKills(r.getKills()));

        boolean isChicken = teamResults.stream().anyMatch(MatchResult::isChicken);
        Integer placement = teamResults.get(0).getPlacement();
        applyRules(team, rules, isChicken, placement);
    }

    private void applyRules(Team team, List<Rule> rules, boolean isChicken, Integer placement) {
        for (Rule rule : rules) {
            switch (rule.getRuleType()) {
                case CHICKEN_BONUS -> {
                    if (isChicken) team.addBonus(rule.getKillValue());
                }
                case SURVIVAL_PENALTY -> {
                    if (placement != null && placement > 10) team.addPenalty(rule.getKillValue());
                }
                case PLACEMENT_BONUS -> {
                    if (isChicken) team.addBonus(rule.getKillValue());
                }
                case CONSECUTIVE_DEATH_PENALTY -> { /* 연속 사망 이력 필요 — 현재 미구현 */ }
            }
        }
    }
}
