package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.SessionDto;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private UserRepository userRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private RuleSetRepository ruleSetRepository;
    @InjectMocks private SessionService sessionService;

    @Test
    @DisplayName("세션 생성 시 Session, RuleSet, Rule이 모두 저장된다")
    void createSession_Session_RuleSet_Rule_모두_저장된다() {
        User host = userFixture();
        Session savedSession = sessionFixture(host);
        RuleSet savedRuleSet = ruleSetFixture(savedSession);

        given(userRepository.findById(1L)).willReturn(Optional.of(host));
        given(sessionRepository.existsByRoomUrl(any())).willReturn(false);
        given(sessionRepository.save(any())).willReturn(savedSession);
        given(ruleSetRepository.save(any())).willReturn(savedRuleSet);
        SessionDto.CreateRequest request = new SessionDto.CreateRequest(
                "테스트 세션", 10, 60,
                List.of(new SessionDto.RuleRequest(
                        Rule.RuleType.CHICKEN_BONUS, Rule.Operator.EQ, 3))
        );

        SessionDto.SessionResponse response = sessionService.createSession(1L, request);

        assertThat(response).isNotNull();
        then(sessionRepository).should().save(any(Session.class));
        then(ruleSetRepository).should().save(any(RuleSet.class));
        then(ruleRepository).should(times(1)).save(any(Rule.class));
    }

    @Test
    @DisplayName("세션 생성 시 rules가 null이면 Rule은 저장되지 않는다")
    void createSession_rules가_null이면_Rule은_저장되지_않는다() {
        User host = userFixture();
        Session savedSession = sessionFixture(host);
        RuleSet savedRuleSet = ruleSetFixture(savedSession);

        given(userRepository.findById(1L)).willReturn(Optional.of(host));
        given(sessionRepository.existsByRoomUrl(any())).willReturn(false);
        given(sessionRepository.save(any())).willReturn(savedSession);
        given(ruleSetRepository.save(any())).willReturn(savedRuleSet);

        SessionDto.CreateRequest request = new SessionDto.CreateRequest(
                "테스트 세션", null, null, null);

        sessionService.createSession(1L, request);

        then(ruleRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("존재하지 않는 사용자로 세션 생성 시 예외를 던진다")
    void createSession_존재하지않는_사용자면_예외를_던진다() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        SessionDto.CreateRequest request = new SessionDto.CreateRequest(
                "테스트 세션", null, null, null);

        assertThatThrownBy(() -> sessionService.createSession(99L, request))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("roomUrl로 세션 조회 시 존재하지 않으면 예외를 던진다")
    void getSessionByRoomUrl_존재하지않으면_예외를_던진다() {
        given(sessionRepository.findByRoomUrl("invalid-url")).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getSessionByRoomUrl("invalid-url"))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("세션을 찾을 수 없습니다");
    }

    private User userFixture() {
        return User.builder()
                .nickname("host")
                .email("host@test.com")
                .password("pw")
                .build();
    }

    private Session sessionFixture(User host) {
        return Session.builder()
                .name("테스트 세션")
                .roomUrl("test-room-url")
                .host(host)
                .build();
    }

    private RuleSet ruleSetFixture(Session session) {
        return RuleSet.builder().session(session).build();
    }
}