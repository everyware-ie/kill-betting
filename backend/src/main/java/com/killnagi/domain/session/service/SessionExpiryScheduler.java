package com.killnagi.domain.session.service;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryScheduler {

    private final SessionRepository sessionRepository;
    private final SessionEndService sessionEndService;

    @Scheduled(fixedDelay = 60_000)
    public void endExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        List<Session> candidates = sessionRepository
                .findByStatusAndTimeLimitMinutesIsNotNull(Session.SessionStatus.IN_PROGRESS);

        candidates.stream()
                .filter(s -> s.isExpired(now))
                .forEach(s -> {
                    log.info("세션 시간 만료 감지: sessionId={}", s.getId());
                    sessionEndService.endByTimeExpiry(s.getId());
                });
    }
}