package com.killnagi.domain.session.service;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 세션 자동 정리 배치. 인메모리 타이머 대신 주기적 폴링으로 만료·무응답 세션을 종료해
 * 재배포·재시작에도 유실 없이 동작한다. (ADR 0002)
 */
@Slf4j
@Component
public class SessionLifecycleScheduler {

    private final SessionRepository sessionRepository;
    private final SessionEndService sessionEndService;
    private final SessionService sessionService;
    private final long inactivityTimeoutHours;
    private final long staleWaitingTimeoutHours;

    public SessionLifecycleScheduler(
            SessionRepository sessionRepository,
            SessionEndService sessionEndService,
            SessionService sessionService,
            @Value("${killnagi.session.lifecycle.inactivity-timeout-hours:6}") long inactivityTimeoutHours,
            @Value("${killnagi.session.lifecycle.stale-waiting-timeout-hours:3}") long staleWaitingTimeoutHours) {
        this.sessionRepository = sessionRepository;
        this.sessionEndService = sessionEndService;
        this.sessionService = sessionService;
        this.inactivityTimeoutHours = inactivityTimeoutHours;
        this.staleWaitingTimeoutHours = staleWaitingTimeoutHours;
    }

    @Scheduled(
            fixedRateString = "${killnagi.session.lifecycle.poll-rate-ms:60000}",
            initialDelayString = "${killnagi.session.lifecycle.poll-rate-ms:60000}")
    public void sweep() {
        LocalDateTime now = LocalDateTime.now();
        endExpiredSessions(now);
        endInactiveSessions(now);
        deleteStaleWaitingSessions(now);
    }

    private void endExpiredSessions(LocalDateTime now) {
        sessionRepository.findByStatusAndTimeLimitMinutesIsNotNull(SessionStatus.IN_PROGRESS).stream()
                .filter(session -> session.isExpired(now))
                .forEach(this::endByTimeExpiry);
    }

    private void endInactiveSessions(LocalDateTime now) {
        sessionRepository.findByStatus(SessionStatus.IN_PROGRESS).stream()
                .filter(session -> session.isInactive(now, inactivityTimeoutHours))
                .forEach(this::endByInactivity);
    }

    private void endByTimeExpiry(Session session) {
        log.info("제한시간 만료 세션 자동 종료: sessionId={}", session.getId());
        sessionEndService.endByTimeExpiry(session.getId());
    }

    private void endByInactivity(Session session) {
        log.info("무응답 세션 자동 종료: sessionId={}", session.getId());
        sessionEndService.endByInactivity(session.getId());
    }

    private void deleteStaleWaitingSessions(LocalDateTime now) {
        sessionRepository.findByStatus(SessionStatus.WAITING).stream()
                .filter(session -> session.isStaleWaiting(now, staleWaitingTimeoutHours))
                .forEach(this::deleteStaleWaiting);
    }

    private void deleteStaleWaiting(Session session) {
        log.info("미시작 대기 세션 자동 삭제: sessionId={}", session.getId());
        sessionService.deleteStaleWaiting(session.getId());
    }
}
