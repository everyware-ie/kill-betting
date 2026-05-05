package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.match.dto.request.ConfirmRequest;
import com.killnagi.domain.match.dto.request.ConfirmRequest.PlayerResult;
import com.killnagi.domain.match.dto.response.ConfirmResponse;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.match.repository.MatchResultRepository;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public ConfirmResponse confirm(Long matchId, Long requesterId, ConfirmRequest request) {
        Match match = findValidMatch(matchId);
        validateLeaderPermission(match.getSession().getId(), requesterId);

        List<MatchResult> results = createAndSaveMatchResults(match, request.playerResults());

        List<Rule> rules = ruleRepository.findByRuleSetSessionIdAndEnabled(match.getSession().getId(), true);
        match.confirm(results, rules, request.isChicken());
        return new ConfirmResponse(matchId, match.getStatus().name());
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
