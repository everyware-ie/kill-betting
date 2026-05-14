package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionService {

    private static final int MIN_TEAMS_TO_START = 2;

    private final SessionRepository sessionRepository;
    private final SessionUserRepository sessionUserRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RuleRepository ruleRepository;
    private final RuleSetRepository ruleSetRepository;
    private final SessionParticipantRegistry registry;
    private final SessionTimerService sessionTimerService;
    private final SessionCodeGenerator sessionCodeGenerator;
    private final SessionBroadcaster sessionBroadcaster;

    @Transactional
    public SessionResponse createSession(Long hostUserId, CreateRequest request) {
        User host = userRepository.findById(hostUserId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        Session session = sessionRepository.save(Session.builder()
                .name(request.name())
                .roomCode(sessionCodeGenerator.generate())
                .host(host)
                .targetKills(request.targetKills())
                .timeLimitMinutes(request.timeLimitMinutes())
                .build());

        RuleSet ruleSet = ruleSetRepository.save(RuleSet.builder()
                .session(session)
                .build());

        if (request.rules() != null) {
            request.rules().forEach(ruleReq ->
                    ruleRepository.save(Rule.builder()
                            .ruleSet(ruleSet)
                            .ruleType(ruleReq.ruleType())
                            .operator(ruleReq.operator())
                            .value(ruleReq.value())
                            .build()));
        }

        session.assignCurrentRuleSet(ruleSet);
        return SessionResponse.from(session);
    }

    @Transactional
    public void startSession(Long sessionId, Long userId) {
        Session session = getSessionOrThrow(sessionId);
        List<Team> teams = teamRepository.findBySessionId(sessionId);

        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("세션 호스트만 시작할 수 있습니다.");
        }

        if (teams.size() < MIN_TEAMS_TO_START) {
            throw KillnagiException.badRequest("최소 " + MIN_TEAMS_TO_START + "팀이 필요합니다.");
        }

        teams.forEach(team -> {
            if (!team.hasLeader()) {
                throw KillnagiException.badRequest(team.getName() + "에 리더가 배정되지 않았습니다.");
            }
            if (team.getPlayers().isEmpty()) {
                throw KillnagiException.badRequest(team.getName() + "에 배그 닉네임이 등록되지 않았습니다.");
            }
        });

        userRepository.findAllById(registry.getParticipantIds(sessionId)).forEach(participant ->
                sessionUserRepository.save(SessionUser.builder()
                        .session(session)
                        .user(participant)
                        .build()));

        session.start();
        sessionBroadcaster.broadcastSessionStarted(sessionId);

        if (session.hasTimeLimit()) {
            sessionTimerService.scheduleExpiry(session.getId(), session.getExpiresAt());
        }
    }

    @Transactional
    public void updateRule(Long sessionId, Long ruleId, int newValue, Long userId) {
        Session session = getSessionOrThrow(sessionId);
        if (!session.isHostedBy(userId)) {
            throw KillnagiException.forbidden("세션 호스트만 룰을 수정할 수 있습니다.");
        }

        Rule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> KillnagiException.notFound("룰을 찾을 수 없습니다."));

        if (!rule.getRuleSet().getSession().getId().equals(sessionId)) {
            throw KillnagiException.badRequest("이 세션의 룰이 아닙니다.");
        }

        rule.updateValue(newValue);
    }

    private Session getSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
    }
}
