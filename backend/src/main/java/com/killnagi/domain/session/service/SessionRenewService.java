package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.response.SessionRenewResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SessionRenewService {

    private static final Pattern ROUND_PATTERN = Pattern.compile("^(.*) (\\d+)라운드$");

    private final SessionRepository sessionRepository;
    private final RuleRepository ruleRepository;
    private final RuleSetRepository ruleSetRepository;
    private final TeamRepository teamRepository;
    private final TeamPlayerRepository teamPlayerRepository;
    private final SessionCodeGenerator sessionCodeGenerator;
    private final SessionBroadcaster sessionBroadcaster;

    @Transactional
    public SessionRenewResponse renew(Long originalSessionId, Long hostUserId) {
        Session original = sessionRepository.findById(originalSessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!original.isEnded()) {
            throw KillnagiException.badRequest("종료된 세션에서만 이어하기를 시작할 수 있습니다.");
        }

        if (!original.isHostedBy(hostUserId)) {
            throw KillnagiException.forbidden("세션 호스트만 이어하기를 시작할 수 있습니다.");
        }

        Session newSession = sessionRepository.save(Session.builder()
                .name(nextRoundName(original.getName()))
                .roomCode(sessionCodeGenerator.generate())
                .host(original.getHost())
                .targetKills(original.getTargetKills())
                .timeLimitMinutes(original.getTimeLimitMinutes())
                .build());

        copyRules(original, newSession);
        copyTeams(original, newSession);

        SessionRenewResponse response = SessionRenewResponse.from(newSession);
        sessionBroadcaster.broadcastSessionRenewed(originalSessionId, response);
        return response;
    }

    private void copyRules(Session original, Session newSession) {
        if (original.getCurrentRuleSet() == null) {
            RuleSet emptyRuleSet = ruleSetRepository.save(RuleSet.builder().session(newSession).build());
            newSession.assignCurrentRuleSet(emptyRuleSet);
            return;
        }

        List<Rule> originalRules = ruleRepository.findByRuleSetIdAndEnabled(
                original.getCurrentRuleSet().getId(), true);

        RuleSet newRuleSet = ruleSetRepository.save(RuleSet.builder().session(newSession).build());
        originalRules.forEach(rule ->
                ruleRepository.save(Rule.builder()
                        .ruleSet(newRuleSet)
                        .ruleType(rule.getRuleType())
                        .operator(rule.getOperator())
                        .value(rule.getValue())
                        .build()));

        newSession.assignCurrentRuleSet(newRuleSet);
    }

    private void copyTeams(Session original, Session newSession) {
        List<Team> originalTeams = teamRepository.findBySessionId(original.getId());

        for (Team originalTeam : originalTeams) {
            Team newTeam = teamRepository.save(Team.builder()
                    .session(newSession)
                    .name(originalTeam.getName())
                    .build());

            // 리더 배정은 복사하지 않는다.
            // 리더는 해당 사용자가 새 세션에 직접 접속(WebSocket 연결)한 후 배정되어야 한다.
            // 미리 배정하면 접속하지 않은 사용자가 이미 참여 중인 것처럼 표시된다.

            originalTeam.getPlayers().forEach(player ->
                    teamPlayerRepository.save(TeamPlayer.builder()
                            .team(newTeam)
                            .playerNickname(player.getPlayerNickname())
                            .build()));
        }
    }

    private String nextRoundName(String name) {
        Matcher matcher = ROUND_PATTERN.matcher(name.trim());
        if (matcher.matches()) {
            String base = matcher.group(1);
            int round = Integer.parseInt(matcher.group(2));
            return base + " " + (round + 1) + "라운드";
        }
        return name.trim() + " 2라운드";
    }
}
