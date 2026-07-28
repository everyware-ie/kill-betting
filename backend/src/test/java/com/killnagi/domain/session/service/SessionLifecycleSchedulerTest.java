package com.killnagi.domain.session.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.Session.SessionStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("세션 생명주기 스케줄러")
class SessionLifecycleSchedulerTest {

    private static final long INACTIVITY_HOURS = 6;

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionEndService sessionEndService;
    private SessionLifecycleScheduler sessionLifecycleScheduler;

    @BeforeEach
    void setUp() {
        sessionLifecycleScheduler = new SessionLifecycleScheduler(
                sessionRepository, sessionEndService, INACTIVITY_HOURS);
    }

    @Test
    @DisplayName("제한시간이 지난 진행중 세션을 시간만료로 종료한다")
    void 제한시간이_지난_진행중_세션을_시간만료로_종료한다() {
        // given
        Session expired = inProgressSessionStartedMinutesAgo(1L, 120);
        given(sessionRepository.findByStatusAndTimeLimitMinutesIsNotNull(SessionStatus.IN_PROGRESS))
                .willReturn(List.of(expired));

        // when
        sessionLifecycleScheduler.sweep();

        // then
        then(sessionEndService).should().endByTimeExpiry(1L);
    }

    @Test
    @DisplayName("제한시간이 남은 진행중 세션은 종료하지 않는다")
    void 제한시간이_남은_진행중_세션은_종료하지_않는다() {
        // given
        Session fresh = inProgressSessionStartedMinutesAgo(2L, 5);
        given(sessionRepository.findByStatusAndTimeLimitMinutesIsNotNull(SessionStatus.IN_PROGRESS))
                .willReturn(List.of(fresh));

        // when
        sessionLifecycleScheduler.sweep();

        // then
        then(sessionEndService).should(never()).endByTimeExpiry(any());
    }

    @Test
    @DisplayName("마지막 매치 확정 후 무응답 임계시간이 지난 진행중 세션을 무응답으로 종료한다")
    void 무응답_임계시간이_지난_진행중_세션을_무응답으로_종료한다() {
        // given
        Session inactive = inProgressSessionLastMatchHoursAgo(3L, 7);
        given(sessionRepository.findByStatus(SessionStatus.IN_PROGRESS))
                .willReturn(List.of(inactive));

        // when
        sessionLifecycleScheduler.sweep();

        // then
        then(sessionEndService).should().endByInactivity(3L);
    }

    @Test
    @DisplayName("무응답 임계시간이 지나지 않은 진행중 세션은 무응답 종료하지 않는다")
    void 무응답_임계시간이_지나지_않은_진행중_세션은_무응답_종료하지_않는다() {
        // given
        Session active = inProgressSessionLastMatchHoursAgo(4L, 1);
        given(sessionRepository.findByStatus(SessionStatus.IN_PROGRESS))
                .willReturn(List.of(active));

        // when
        sessionLifecycleScheduler.sweep();

        // then
        then(sessionEndService).should(never()).endByInactivity(any());
    }

    private Session inProgressSessionStartedMinutesAgo(Long id, int minutesAgo) {
        Session session = startedSession(id);
        ReflectionTestUtils.setField(session, "startedAt", LocalDateTime.now().minusMinutes(minutesAgo));
        return session;
    }

    private Session inProgressSessionLastMatchHoursAgo(Long id, int hoursAgo) {
        Session session = startedSession(id);
        session.touchLastMatch(LocalDateTime.now().minusHours(hoursAgo));
        return session;
    }

    private Session startedSession(Long id) {
        User host = TestFixtures.user(id);
        Session session = TestFixtures.session(id, host); // timeLimitMinutes=60
        session.start();
        return session;
    }
}
