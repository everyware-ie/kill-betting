package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.dto.response.MySessionResponse;
import com.killnagi.domain.session.dto.response.MySessionResponse.SessionRole;
import com.killnagi.domain.session.dto.response.RuleResponse;
import com.killnagi.domain.session.dto.response.SessionDetailResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.HiddenSessionRepository;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionQueryService {

    private final SessionRepository sessionRepository;
    private final RuleRepository ruleRepository;
    private final TeamRepository teamRepository;
    private final HiddenSessionRepository hiddenSessionRepository;

    public List<SessionResponse> getWaitingSessions() {
        return sessionRepository.findByStatus(SessionStatus.WAITING).stream()
                .map(SessionResponse::from)
                .toList();
    }

    public SessionResponse getSessionByRoomCode(String roomCode) {
        Session session = findByRoomCodeOrThrow(roomCode);
        return SessionResponse.from(session);
    }

    public SessionDetailResponse getSessionDetailByRoomCode(String roomCode) {
        Session session = findByRoomCodeOrThrow(roomCode);
        List<RuleResponse> rules = findEnabledRules(session);
        return SessionDetailResponse.from(session, rules);
    }

    public List<MySessionResponse> getMySessions(Long userId) {
        List<Session> sessions = sessionRepository.findSessionsByUserId(userId);
        Set<Long> leaderSessionIds = teamRepository.findSessionIdsByLeaderUserId(userId);

        List<Session> allSessions = withMissingLeaderSessions(sessions, leaderSessionIds);
        Set<Long> hiddenSessionIds = hiddenSessionRepository.findSessionIdsByUserId(userId);

        return allSessions.stream()
                .filter(session -> !hiddenSessionIds.contains(session.getId()))
                .map(session -> MySessionResponse.of(session, resolveRole(session, userId, leaderSessionIds)))
                .toList();
    }

    private List<Session> withMissingLeaderSessions(List<Session> sessions, Set<Long> leaderSessionIds) {
        Set<Long> coveredIds = sessions.stream().map(Session::getId).collect(Collectors.toSet());
        List<Long> missingIds = leaderSessionIds.stream()
                .filter(id -> !coveredIds.contains(id))
                .toList();

        if (missingIds.isEmpty()) {
            return sessions;
        }

        List<Session> allSessions = new ArrayList<>(sessions);
        allSessions.addAll(sessionRepository.findAllById(missingIds));
        return allSessions;
    }

    private SessionRole resolveRole(Session session, Long userId, Set<Long> leaderSessionIds) {
        if (session.isHostedBy(userId)) {
            return SessionRole.HOST;
        }
        if (leaderSessionIds.contains(session.getId())) {
            return SessionRole.LEADER;
        }
        return SessionRole.PARTICIPANT;
    }

    private Session findByRoomCodeOrThrow(String roomCode) {
        return sessionRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> KillnagiException.notFound("방 코드에 해당하는 세션을 찾을 수 없습니다."));
    }

    private List<RuleResponse> findEnabledRules(Session session) {
        if (session.getCurrentRuleSet() == null) {
            return List.of();
        }
        return ruleRepository.findByRuleSetIdAndEnabled(session.getCurrentRuleSet().getId(), true).stream()
                .map(RuleResponse::from)
                .toList();
    }
}