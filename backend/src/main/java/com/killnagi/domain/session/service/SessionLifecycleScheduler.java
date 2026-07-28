package com.killnagi.domain.session.service;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 세션 자동 정리 배치. 인메모리 타이머 대신 주기적 폴링으로 만료 세션을 종료해
 * 재배포·재시작에도 유실 없이 동작한다. (ADR 0002)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionLifecycleScheduler {

    private final SessionRepository sessionRepository;
    private final SessionEndService sessionEndService;

    @Scheduled(
            fixedRateString = "${killnagi.session.lifecycle.poll-rate-ms:60000}",
            initialDelayString = "${killnagi.session.lifecycle.poll-rate-ms:60000}")
    public void sweep() {
        LocalDateTime now = LocalDateTime.now();
        endExpiredSessions(now);
    }

    private void endExpiredSessions(LocalDateTime now) {
        sessionRepository.findByStatusAndTimeLimitMinutesIsNotNull(SessionStatus.IN_PROGRESS).stream()
                .filter(session -> session.isExpired(now))
                .forEach(this::endByTimeExpiry);
    }

    private void endByTimeExpiry(Session session) {
        log.info("제한시간 만료 세션 자동 종료: sessionId={}", session.getId());
        sessionEndService.endByTimeExpiry(session.getId());
    }
}
