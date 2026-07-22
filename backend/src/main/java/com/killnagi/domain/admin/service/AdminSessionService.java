package com.killnagi.domain.admin.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.admin.dto.response.AdminSessionDetailResponse;
import com.killnagi.domain.admin.dto.response.AdminSessionMetaResponse;
import com.killnagi.domain.admin.dto.response.AdminSessionSummaryResponse;
import com.killnagi.domain.session.dto.response.SessionParticipantCount;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.session.service.SessionMatchService;
import com.killnagi.domain.team.service.TeamService;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AdminSessionService {

    private final SessionRepository sessionRepository;
    private final SessionUserRepository sessionUserRepository;
    private final SessionMatchService sessionMatchService;
    private final TeamService teamService;

    public Page<AdminSessionSummaryResponse> getSessions(SessionStatus status, Pageable pageable) {
        Page<Session> sessions = (status == null)
                ? sessionRepository.findAllWithHost(pageable)
                : sessionRepository.findByStatusWithHost(status, pageable);

        Map<Long, Long> participantCounts = participantCountsBySessionId(sessions.getContent());

        return sessions.map(session -> toSummary(session, participantCounts));
    }

    public AdminSessionDetailResponse getSessionDetail(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        return new AdminSessionDetailResponse(
                AdminSessionMetaResponse.from(session),
                teamService.getTeams(sessionId),
                sessionMatchService.getMatchHistory(sessionId),
                sessionMatchService.getScoreboard(sessionId)
        );
    }

    private Map<Long, Long> participantCountsBySessionId(List<Session> sessions) {
        List<Long> sessionIds = sessions.stream().map(Session::getId).toList();
        if (sessionIds.isEmpty()) {
            return Map.of();
        }
        return sessionUserRepository.countActiveParticipantsBySessionIds(sessionIds).stream()
                .collect(Collectors.toMap(SessionParticipantCount::sessionId, SessionParticipantCount::count));
    }

    private AdminSessionSummaryResponse toSummary(Session session, Map<Long, Long> participantCounts) {
        return new AdminSessionSummaryResponse(
                session.getId(),
                session.getName(),
                session.getHost().getNickname(),
                session.getStatus(),
                session.getRoomCode(),
                session.getCreatedAt(),
                participantCounts.getOrDefault(session.getId(), 0L)
        );
    }
}