package com.killnagi.domain.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMetricsService 운영 지표 집계 테스트")
class AdminMetricsServiceTest {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 22, 12, 0);

    @Mock UserRepository userRepository;
    @Mock SessionRepository sessionRepository;
    @Mock SessionUserRepository sessionUserRepository;

    AdminMetricsService adminMetricsService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        adminMetricsService = new AdminMetricsService(
                userRepository, sessionRepository, sessionUserRepository, fixedClock);
    }

    @Test
    @DisplayName("전체 가입 유저 수를 총 가입 수로 반환한다")
    void 전체_가입_유저_수를_총_가입_수로_반환한다() {
        given(userRepository.count()).willReturn(42L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.totalUsers()).isEqualTo(42L);
    }

    @Test
    @DisplayName("최근 7일/30일 신규 가입 수를 각 기간 기준 시각으로 조회해 반환한다")
    void 최근_7일_30일_신규_가입_수를_반환한다() {
        given(userRepository.countByCreatedAtAfter(NOW.minusDays(7))).willReturn(3L);
        given(userRepository.countByCreatedAtAfter(NOW.minusDays(30))).willReturn(11L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.newUsers7d()).isEqualTo(3L);
        assertThat(response.newUsers30d()).isEqualTo(11L);
    }

    @Test
    @DisplayName("총 세션 수와 상태별(WAITING/IN_PROGRESS/ENDED) 세션 수를 반환한다")
    void 총_세션_수와_상태별_세션_수를_반환한다() {
        given(sessionRepository.count()).willReturn(10L);
        given(sessionRepository.countByStatus(SessionStatus.WAITING)).willReturn(2L);
        given(sessionRepository.countByStatus(SessionStatus.IN_PROGRESS)).willReturn(3L);
        given(sessionRepository.countByStatus(SessionStatus.ENDED)).willReturn(5L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.totalSessions()).isEqualTo(10L);
        assertThat(response.sessionsByStatus())
                .containsEntry("WAITING", 2L)
                .containsEntry("IN_PROGRESS", 3L)
                .containsEntry("ENDED", 5L);
    }

    @Test
    @DisplayName("세션당 평균 참가자 수는 활성 참가자 수를 세션 수로 나눠 소수 2자리로 반올림한다")
    void 세션당_평균_참가자_수를_소수_2자리로_반올림한다() {
        given(sessionRepository.count()).willReturn(3L);
        given(sessionUserRepository.countByStatus(SessionUserStatus.ACTIVE)).willReturn(10L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        // 10 / 3 = 3.333... → 3.33
        assertThat(response.avgParticipantsPerSession()).isEqualTo(3.33);
    }

    @Test
    @DisplayName("세션 수가 0이면 세션당 평균 참가자 수는 0이다")
    void 세션_수가_0이면_세션당_평균_참가자_수는_0이다() {
        given(sessionUserRepository.countByStatus(SessionUserStatus.ACTIVE)).willReturn(5L);
        // sessionRepository.count() 미스텁 → 0

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.avgParticipantsPerSession()).isZero();
    }

    @Test
    @DisplayName("유저당 평균 참여 세션 수는 전체 참여 수를 유저 수로 나눠 소수 2자리로 반올림한다")
    void 유저당_평균_참여_세션_수를_소수_2자리로_반올림한다() {
        given(userRepository.count()).willReturn(2L);
        given(sessionUserRepository.count()).willReturn(7L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        // 7 / 2 = 3.5
        assertThat(response.avgSessionsPerUser()).isEqualTo(3.5);
    }

    @Test
    @DisplayName("유저 수가 0이면 유저당 평균 참여 세션 수는 0이다")
    void 유저_수가_0이면_유저당_평균_참여_세션_수는_0이다() {
        given(sessionUserRepository.count()).willReturn(4L);
        // userRepository.count() 미스텁 → 0

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.avgSessionsPerUser()).isZero();
    }

    @Test
    @DisplayName("최근 7일/30일 활성 유저 수를 각 기간 기준 시각으로 조회해 반환한다")
    void 최근_7일_30일_활성_유저_수를_반환한다() {
        given(sessionUserRepository.countDistinctUsersByJoinedAtAfter(NOW.minusDays(7))).willReturn(4L);
        given(sessionUserRepository.countDistinctUsersByJoinedAtAfter(NOW.minusDays(30))).willReturn(9L);

        AdminMetricsResponse response = adminMetricsService.getMetrics();

        assertThat(response.activeUsers7d()).isEqualTo(4L);
        assertThat(response.activeUsers30d()).isEqualTo(9L);
    }
}