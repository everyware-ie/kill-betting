package com.killnagi.domain.session.service;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionTimerService {

    private final TaskScheduler taskScheduler;
    private final SessionRepository sessionRepository;
    private final SessionEndService sessionEndService;

    public void scheduleExpiry(Long sessionId, LocalDateTime expiresAt) {
        Instant fireAt = expiresAt.atZone(ZoneId.systemDefault()).toInstant();
        taskScheduler.schedule(() -> sessionEndService.endByTimeExpiry(sessionId), fireAt);
        log.info("세션 타이머 등록: sessionId={}, expiresAt={}", sessionId, expiresAt);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recoverInProgressSessions() {
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.findByStatusAndTimeLimitMinutesIsNotNull(Session.SessionStatus.IN_PROGRESS)
                .forEach(session -> recoverSession(session, now));
    }

    private void recoverSession(Session session, LocalDateTime now) {
        if (session.isExpired(now)) {
            log.info("재시작 후 만료 세션 즉시 종료: sessionId={}", session.getId());
            sessionEndService.endByTimeExpiry(session.getId());
        } else {
            log.info("재시작 후 세션 타이머 재등록: sessionId={}", session.getId());
            scheduleExpiry(session.getId(), session.getExpiresAt());
        }
    }
}