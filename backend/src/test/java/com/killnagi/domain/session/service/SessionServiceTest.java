package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

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

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Operator;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.request.CreateRequest;
import com.killnagi.domain.session.dto.request.RuleRequest;
import com.killnagi.domain.session.dto.request.UpdateSettingsRequest;
import com.killnagi.domain.session.dto.response.SessionResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService 세션 관리 테스트")
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private SessionUserRepository sessionUserRepository;
    @Mock private UserRepository userRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private RuleSetRepository ruleSetRepository;
    @Mock private SessionParticipantRegistry registry;
    @Mock private SessionCodeGenerator sessionCodeGenerator;
    @Mock private SessionBroadcaster sessionBroadcaster;
    @Spy MeterRegistry meterRegistry = new SimpleMeterRegistry();
    @InjectMocks private SessionService sessionService;

    private static final Long HOST_ID = 1L;
    private static final Long SESSION_ID = 10L;

    @Test
    void 세션_생성_성공시_응답을_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        Session savedSession = TestFixtures.session(SESSION_ID, host);
        RuleSet savedRuleSet = RuleSet.builder().session(savedSession).build();
        CreateRequest request = new CreateRequest("킬내기 세션", 50, 60, null);

        given(userRepository.findById(HOST_ID)).willReturn(Optional.of(host));
        given(sessionRepository.save(any(Session.class))).willReturn(savedSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(savedRuleSet);

        SessionResponse response = sessionService.createSession(HOST_ID, request);

        assertThat(response.id()).isEqualTo(SESSION_ID);
        assertThat(response.name()).isEqualTo("킬내기 세션");
    }

    @Test
    void 세션_생성시_rules가_있으면_Session_RuleSet_Rule이_모두_저장된다() {
        User host = TestFixtures.user(HOST_ID);
        Session savedSession = TestFixtures.session(SESSION_ID, host);
        RuleSet savedRuleSet = RuleSet.builder().session(savedSession).build();
        CreateRequest request = new CreateRequest(
                "킬내기 세션", 50, 60,
                List.of(new RuleRequest(RuleType.CHICKEN_BONUS, Operator.PLUS, 3))
        );

        given(userRepository.findById(HOST_ID)).willReturn(Optional.of(host));
        given(sessionRepository.save(any(Session.class))).willReturn(savedSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(savedRuleSet);

        sessionService.createSession(HOST_ID, request);

        then(sessionRepository).should().save(any(Session.class));
        then(ruleSetRepository).should().save(any(RuleSet.class));
        then(ruleRepository).should(times(1)).save(any(Rule.class));
    }

    @Test
    void 세션_생성시_rules가_null이면_Rule은_저장되지_않는다() {
        User host = TestFixtures.user(HOST_ID);
        Session savedSession = TestFixtures.session(SESSION_ID, host);
        RuleSet savedRuleSet = RuleSet.builder().session(savedSession).build();
        CreateRequest request = new CreateRequest("킬내기 세션", null, null, null);

        given(userRepository.findById(HOST_ID)).willReturn(Optional.of(host));
        given(sessionRepository.save(any(Session.class))).willReturn(savedSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(savedRuleSet);

        sessionService.createSession(HOST_ID, request);

        then(ruleRepository).shouldHaveNoInteractions();
    }

    @Test
    void 인당_패널티와_팀_패널티를_함께_등록하면_예외가_발생한다() {
        CreateRequest request = new CreateRequest(
                "킬내기 세션", 50, 60,
                List.of(
                        new RuleRequest(RuleType.SURVIVAL_PENALTY, Operator.MINUS, 2),
                        new RuleRequest(RuleType.TEAM_SURVIVAL_PENALTY, Operator.MINUS, 3)
                )
        );

        assertThatThrownBy(() -> sessionService.createSession(HOST_ID, request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("생존 패널티는 인당/팀 방식 중 하나만 사용할 수 있습니다.");
    }

    @Test
    void 존재하지_않는_유저가_세션_생성시_예외가_발생한다() {
        CreateRequest request = new CreateRequest("킬내기 세션", 50, 60, null);
        given(userRepository.findById(HOST_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.createSession(HOST_ID, request))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("사용자를 찾을 수 없습니다.");
    }

    @Test
    void 호스트가_세션을_시작하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        List<Team> teams = List.of(
                TestFixtures.readyTeam(session, TestFixtures.user(2L)),
                TestFixtures.readyTeam(session, TestFixtures.user(3L))
        );

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(teams);

        sessionService.startSession(SESSION_ID, HOST_ID);

        assertThat(session.isWaiting()).isFalse();
    }

    @Test
    void 호스트가_아니면_세션_시작시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        assertThatThrownBy(() -> sessionService.startSession(SESSION_ID, otherUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 시작할 수 있습니다.");
    }

    @Test
    void 팀이_2개_미만이면_세션_시작시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(TestFixtures.team(session)));

        assertThatThrownBy(() -> sessionService.startSession(SESSION_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("최소 2팀이 필요합니다.");
    }

    @Test
    void 리더가_없는_팀이_있으면_세션_시작시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team teamWithoutLeader = TestFixtures.team(session);
        teamWithoutLeader.getPlayers().add(TestFixtures.player(teamWithoutLeader));
        List<Team> teams = List.of(
                TestFixtures.readyTeam(session, TestFixtures.user(2L)),
                teamWithoutLeader
        );

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(teams);

        assertThatThrownBy(() -> sessionService.startSession(SESSION_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("리더가 배정되지 않았습니다");
    }

    @Test
    void 플레이어가_없는_팀이_있으면_세션_시작시_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Team teamWithoutPlayers = TestFixtures.team(session);
        teamWithoutPlayers.assignLeader(TestFixtures.user(2L));
        List<Team> teams = List.of(
                TestFixtures.readyTeam(session, TestFixtures.user(3L)),
                teamWithoutPlayers
        );

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(teams);

        assertThatThrownBy(() -> sessionService.startSession(SESSION_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessageContaining("배그 닉네임이 등록되지 않았습니다");
    }

    @Test
    void 호스트가_룰_값을_수정하면_성공한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Rule rule = TestFixtures.rule(session, RuleType.CHICKEN_BONUS, Operator.PLUS, 5);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(ruleRepository.findById(rule.getId())).willReturn(Optional.of(rule));

        sessionService.updateRule(SESSION_ID, rule.getId(), 10, HOST_ID);

        assertThat(rule.getValue()).isEqualTo(10);
    }

    @Test
    void 호스트가_아니면_룰_수정시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Rule rule = TestFixtures.rule(session, RuleType.CHICKEN_BONUS, Operator.PLUS, 5);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.updateRule(SESSION_ID, rule.getId(), 10, otherUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 룰을 수정할 수 있습니다.");
    }

    @Test
    void 존재하지_않는_룰을_수정하려_하면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(ruleRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.updateRule(SESSION_ID, 999L, 10, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("룰을 찾을 수 없습니다.");
    }

    @Test
    void 다른_세션의_룰을_수정하려_하면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        User otherHost = TestFixtures.user(2L);
        Session otherSession = TestFixtures.session(20L, otherHost);
        Rule otherRule = TestFixtures.rule(otherSession, RuleType.CHICKEN_BONUS, Operator.PLUS, 5);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(ruleRepository.findById(otherRule.getId())).willReturn(Optional.of(otherRule));

        assertThatThrownBy(() -> sessionService.updateRule(SESSION_ID, otherRule.getId(), 10, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("이 세션의 룰이 아닙니다.");
    }

    @Test
    void 룰_값이_1_미만이면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        Rule rule = TestFixtures.rule(session, RuleType.CHICKEN_BONUS, Operator.PLUS, 5);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));
        given(ruleRepository.findById(rule.getId())).willReturn(Optional.of(rule));

        assertThatThrownBy(() -> sessionService.updateRule(SESSION_ID, rule.getId(), 0, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("룰 값은 1 이상이어야 합니다.");
    }

    @Test
    void 호스트가_세션_설정을_수정하면_반영된다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        sessionService.updateSettings(SESSION_ID, HOST_ID, new UpdateSettingsRequest(70, 30));

        assertThat(session.getTargetKills()).isEqualTo(70);
        assertThat(session.getTimeLimitMinutes()).isEqualTo(30);
    }

    @Test
    void 호스트가_방을_삭제하면_소프트삭제된다() {
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        sessionService.deleteByHost(SESSION_ID, HOST_ID);

        assertThat(session.isDeleted()).isTrue();
    }

    @Test
    void 호스트가_아니면_세션_설정_수정시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.updateSettings(SESSION_ID, otherUserId, new UpdateSettingsRequest(70, 30)))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 설정을 수정할 수 있습니다.");
    }

    @Test
    void 호스트가_아니면_방_삭제시_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session session = TestFixtures.session(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.deleteByHost(SESSION_ID, otherUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 삭제할 수 있습니다.");
        assertThat(session.isDeleted()).isFalse();
    }

    @Test
    void 시스템이_미시작_대기세션을_삭제하면_소프트삭제된다() {
        User host = TestFixtures.user(HOST_ID);
        Session waiting = TestFixtures.session(SESSION_ID, host);
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(waiting));

        sessionService.deleteStaleWaiting(SESSION_ID);

        assertThat(waiting.isDeleted()).isTrue();
    }

    @Test
    void 이미_시작된_세션은_미시작삭제_대상이_아니어서_삭제되지_않는다() {
        User host = TestFixtures.user(HOST_ID);
        Session started = TestFixtures.session(SESSION_ID, host);
        started.start();
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(started));

        sessionService.deleteStaleWaiting(SESSION_ID);

        assertThat(started.isDeleted()).isFalse();
    }
}
