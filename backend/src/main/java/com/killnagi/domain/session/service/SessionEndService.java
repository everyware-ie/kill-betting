package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.event.SessionEndEvent;
import com.killnagi.domain.session.event.SessionEndReason;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionEndService {

    private final SessionRepository sessionRepository;
    private final TeamRepository teamRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void endByKillLimit(Session session, Team winner) {
        if (!session.isInProgress()) {
            return;
        }
        session.end(winner);
        eventPublisher.publishEvent(toEvent(session.getId(), winner, SessionEndReason.KILL_LIMIT_REACHED));
    }

    @Transactional
    public void endByTimeExpiry(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        if (!session.isInProgress()) {
            return;
        }
        endWithWinnerDetermination(session, SessionEndReason.TIME_EXPIRED);
    }

    @Transactional
    public void endByHost(Long sessionId, Long hostId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        if (!session.isInProgress()) {
            throw KillnagiException.badRequest("진행 중인 세션만 종료할 수 있습니다.");
        }
        if (!session.isHostedBy(hostId)) {
            throw KillnagiException.forbidden("세션 호스트만 종료할 수 있습니다.");
        }
        endWithWinnerDetermination(session, SessionEndReason.HOST_TERMINATED);
    }

    private void endWithWinnerDetermination(Session session, SessionEndReason reason) {
        Optional<Team> winner = determineWinner(session.getId());
        session.end(winner.orElse(null));
        eventPublisher.publishEvent(toEvent(session.getId(), winner.orElse(null), reason));
    }

    private Optional<Team> determineWinner(Long sessionId) {
        List<Team> teams = teamRepository.findBySessionId(sessionId);
        int maxKills = teams.stream().mapToInt(Team::getEffectiveKills).max().orElse(0);
        List<Team> topTeams = teams.stream()
                .filter(t -> t.getEffectiveKills() == maxKills)
                .toList();
        return topTeams.size() == 1 ? Optional.of(topTeams.getFirst()) : Optional.empty();
    }

    private SessionEndEvent toEvent(Long sessionId, Team winner, SessionEndReason reason) {
        return new SessionEndEvent(
                sessionId,
                winner != null ? winner.getId() : null,
                winner != null ? winner.getName() : null,
                reason);
    }
}