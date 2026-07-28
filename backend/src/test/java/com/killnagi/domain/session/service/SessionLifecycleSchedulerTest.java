package com.killnagi.domain.session.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionEndService sessionEndService;
    @InjectMocks private SessionLifecycleScheduler sessionLifecycleScheduler;

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

    private Session inProgressSessionStartedMinutesAgo(Long id, int minutesAgo) {
        User host = TestFixtures.user(id);
        Session session = TestFixtures.session(id, host); // timeLimitMinutes=60
        session.start();
        ReflectionTestUtils.setField(session, "startedAt", LocalDateTime.now().minusMinutes(minutesAgo));
        return session;
    }
}
