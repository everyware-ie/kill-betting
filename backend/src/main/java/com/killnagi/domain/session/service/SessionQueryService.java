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
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionQueryService {

    private final SessionRepository sessionRepository;
    private final RuleRepository ruleRepository;
    private final TeamRepository teamRepository;

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

        return sessions.stream()
                .map(session -> MySessionResponse.of(session, resolveRole(session, userId, leaderSessionIds)))
                .toList();
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