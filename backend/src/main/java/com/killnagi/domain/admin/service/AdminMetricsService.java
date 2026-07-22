package com.killnagi.domain.admin.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.user.repository.UserRepository;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AdminMetricsService {

    private static final int RECENT_DAYS_SHORT = 7;
    private static final int RECENT_DAYS_LONG = 30;

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final SessionUserRepository sessionUserRepository;
    private final Clock clock;

    public AdminMetricsResponse getMetrics() {
        LocalDateTime now = LocalDateTime.now(clock);

        long totalUsers = userRepository.count();
        long totalSessions = sessionRepository.count();

        return new AdminMetricsResponse(
                totalUsers,
                userRepository.countByCreatedAtAfter(now.minusDays(RECENT_DAYS_SHORT)),
                userRepository.countByCreatedAtAfter(now.minusDays(RECENT_DAYS_LONG)),
                totalSessions,
                countSessionsByStatus(),
                roundedAverage(sessionUserRepository.countByStatus(SessionUserStatus.ACTIVE), totalSessions),
                roundedAverage(sessionUserRepository.count(), totalUsers),
                sessionUserRepository.countDistinctUsersByJoinedAtAfter(now.minusDays(RECENT_DAYS_SHORT)),
                sessionUserRepository.countDistinctUsersByJoinedAtAfter(now.minusDays(RECENT_DAYS_LONG))
        );
    }

    private Map<String, Long> countSessionsByStatus() {
        Map<String, Long> countByStatus = new LinkedHashMap<>();
        for (SessionStatus status : SessionStatus.values()) {
            countByStatus.put(status.name(), sessionRepository.countByStatus(status));
        }
        return countByStatus;
    }

    private double roundedAverage(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }
        double average = (double) numerator / denominator;
        return Math.round(average * 100) / 100.0;
    }
}