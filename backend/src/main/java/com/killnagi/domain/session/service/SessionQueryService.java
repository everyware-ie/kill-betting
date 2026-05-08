package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.session.dto.response.RuleResponse;
import com.killnagi.domain.session.dto.response.SessionDetailResponse;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionQueryService {

    private final SessionRepository sessionRepository;
    private final RuleRepository ruleRepository;

    public SessionResponse getSessionById(Long sessionId) {
        Session session = getSessionOrThrow(sessionId);
        return SessionResponse.from(session);
    }

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

    public List<SessionResponse> getMySessions(Long userId) {
        return sessionRepository.findSessionsByUserId(userId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    private Session getSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
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