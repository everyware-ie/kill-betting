package com.killnagi.domain.admin.dto.response;

import java.util.Map;

public record AdminMetricsResponse(
        long totalUsers,
        long newUsers7d,
        long newUsers30d,
        long totalSessions,
        Map<String, Long> sessionsByStatus,
        double avgParticipantsPerSession,
        double avgSessionsPerUser,
        long activeUsers7d,
        long activeUsers30d
) {
}