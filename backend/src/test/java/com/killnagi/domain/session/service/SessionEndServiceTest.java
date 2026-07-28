package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.any;

import java.util.List;
import java.util.Optional;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.event.SessionEndEvent;
import com.killnagi.domain.session.event.SessionEndReason;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionEndService 세션 종료 테스트")
class SessionEndServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Spy private MeterRegistry meterRegistry = new SimpleMeterRegistry();
    @InjectMocks private SessionEndService sessionEndService;

    private static final Long SESSION_ID = 10L;

    @Test
    @DisplayName("무응답으로 종료하면 세션이 ENDED가 되고 INACTIVITY 이벤트가 발행된다")
    void 무응답으로_종료하면_ENDED가_되고_INACTIVITY_이벤트가_발행된다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(SESSION_ID, host);
        session.start();
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        sessionEndService.endByInactivity(SESSION_ID);

        assertThat(session.isEnded()).isTrue();
        then(eventPublisher).should().publishEvent(argThatReason(SessionEndReason.INACTIVITY));
    }

    @Test
    @DisplayName("이미 종료된 세션이면 무응답 종료는 아무것도 하지 않는다")
    void 이미_종료된_세션이면_무응답_종료는_아무것도_하지_않는다() {
        User host = TestFixtures.user(1L);
        Session ended = TestFixtures.endedSession(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(ended));

        sessionEndService.endByInactivity(SESSION_ID);

        then(eventPublisher).shouldHaveNoInteractions();
    }

    private SessionEndEvent argThatReason(SessionEndReason reason) {
        return org.mockito.ArgumentMatchers.argThat(event ->
                event instanceof SessionEndEvent e && e.reason() == reason);
    }
}
