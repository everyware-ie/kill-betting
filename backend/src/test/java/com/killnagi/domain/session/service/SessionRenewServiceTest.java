package com.killnagi.domain.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Operator;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.rule.repository.RuleRepository;
import com.killnagi.domain.rule.repository.RuleSetRepository;
import com.killnagi.domain.session.dto.response.SessionRenewResponse;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.team.repository.TeamPlayerRepository;
import com.killnagi.domain.team.repository.TeamRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionRenewService 이어하기 테스트")
class SessionRenewServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private RuleRepository ruleRepository;
    @Mock private RuleSetRepository ruleSetRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamPlayerRepository teamPlayerRepository;
    @Mock private SessionCodeGenerator sessionCodeGenerator;
    @Mock private SessionBroadcaster sessionBroadcaster;
    @InjectMocks private SessionRenewService sessionRenewService;

    private static final Long HOST_ID = 1L;
    private static final Long SESSION_ID = 10L;
    private static final Long NEW_SESSION_ID = 20L;

    @Test
    void 이름에_라운드_suffix가_없으면_2라운드를_붙인다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host, "금요일 새벽전");
        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willReturn(newSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        sessionRenewService.renew(SESSION_ID, HOST_ID);

        then(sessionRepository).should().save(any(Session.class));
    }

    @Test
    void 이름이_N라운드로_끝나면_N_1라운드로_증가한다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host, "금요일 새벽전 2라운드");
        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willAnswer(invocation -> {
            Session s = invocation.getArgument(0);
            assertThat(s.getName()).isEqualTo("금요일 새벽전 3라운드");
            return newSession;
        });
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        sessionRenewService.renew(SESSION_ID, HOST_ID);
    }

    @Test
    void 이름이_1라운드로_끝나면_2라운드로_증가한다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host, "토요일 새벽전 1라운드");
        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willAnswer(invocation -> {
            Session s = invocation.getArgument(0);
            assertThat(s.getName()).isEqualTo("토요일 새벽전 2라운드");
            return newSession;
        });
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        sessionRenewService.renew(SESSION_ID, HOST_ID);
    }

    @Test
    void 활성화된_룰이_있으면_새_세션에_복사된다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        RuleSet originalRuleSet = RuleSet.builder().session(original).build();
        original.assignCurrentRuleSet(originalRuleSet);
        Rule originalRule = TestFixtures.rule(original, RuleType.CHICKEN_BONUS, Operator.PLUS, 5);

        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willReturn(newSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(ruleRepository.findByRuleSetIdAndEnabled(any(), anyBoolean())).willReturn(List.of(originalRule));
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        sessionRenewService.renew(SESSION_ID, HOST_ID);

        then(ruleRepository).should().save(any(Rule.class));
    }

    @Test
    void 팀과_플레이어_닉네임이_새_세션에_복사된다() {
        User host = TestFixtures.user(HOST_ID);
        User leader = TestFixtures.user(2L);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        Team originalTeam = TestFixtures.readyTeam(original, leader);

        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        Team newTeam = TestFixtures.team(newSession);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willReturn(newSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(originalTeam));
        given(teamRepository.save(any(Team.class))).willReturn(newTeam);

        sessionRenewService.renew(SESSION_ID, HOST_ID);

        then(teamRepository).should().save(any(Team.class));
        then(teamPlayerRepository).should().save(any(TeamPlayer.class));
    }

    @Test
    void 이어하기로_생성된_팀에는_리더가_배정되지_않는다() {
        User host = TestFixtures.user(HOST_ID);
        User leader = TestFixtures.user(2L);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        Team originalTeam = TestFixtures.readyTeam(original, leader);

        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willReturn(newSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of(originalTeam));
        given(teamRepository.save(any(Team.class))).willAnswer(invocation -> {
            Team saved = invocation.getArgument(0);
            assertThat(saved.hasLeader()).isFalse();
            return saved;
        });

        sessionRenewService.renew(SESSION_ID, HOST_ID);
    }

    @Test
    void 이어하기_성공시_WebSocket으로_SESSION_RENEWED를_브로드캐스트한다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        Session newSession = TestFixtures.session(NEW_SESSION_ID, host);
        RuleSet newRuleSet = RuleSet.builder().session(newSession).build();

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionCodeGenerator.generate()).willReturn("ABCDEF");
        given(sessionRepository.save(any(Session.class))).willReturn(newSession);
        given(ruleSetRepository.save(any(RuleSet.class))).willReturn(newRuleSet);
        given(teamRepository.findBySessionId(SESSION_ID)).willReturn(List.of());

        SessionRenewResponse response = sessionRenewService.renew(SESSION_ID, HOST_ID);

        then(sessionBroadcaster).should().broadcastSessionRenewed(SESSION_ID, response);
    }

    @Test
    void 종료되지_않은_세션을_이어하기_시도하면_예외가_발생한다() {
        User host = TestFixtures.user(HOST_ID);
        Session activeSession = TestFixtures.session(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(activeSession));

        assertThatThrownBy(() -> sessionRenewService.renew(SESSION_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("종료된 세션에서만 이어하기를 시작할 수 있습니다.");
    }

    @Test
    void 호스트가_아닌_사용자가_이어하기_시도하면_예외가_발생한다() {
        Long otherUserId = 99L;
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));

        assertThatThrownBy(() -> sessionRenewService.renew(SESSION_ID, otherUserId))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션 호스트만 이어하기를 시작할 수 있습니다.");
    }

    @Test
    void 존재하지_않는_세션을_이어하기_시도하면_예외가_발생한다() {
        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sessionRenewService.renew(SESSION_ID, HOST_ID))
                .isInstanceOf(KillnagiException.class)
                .hasMessage("세션을 찾을 수 없습니다.");
    }

    @Test
    void 이미_이어하기_세션이_있으면_새로_생성하지_않고_기존_세션_정보를_반환한다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        Session existing = TestFixtures.session(NEW_SESSION_ID, host);
        ReflectionTestUtils.setField(existing, "roomCode", "EXIST1");
        ReflectionTestUtils.setField(existing, "name", "금요일 새벽전 2라운드");
        original.assignRenewedSession(existing);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionRepository.findById(NEW_SESSION_ID)).willReturn(Optional.of(existing));

        SessionRenewResponse response = sessionRenewService.renew(SESSION_ID, HOST_ID);

        assertThat(response.roomCode()).isEqualTo("EXIST1");
        assertThat(response.name()).isEqualTo("금요일 새벽전 2라운드");
        then(sessionRepository).should(times(1)).findById(SESSION_ID); // save 호출 없음
        then(sessionBroadcaster).shouldHaveNoInteractions();
    }

    @Test
    void 이미_이어하기_세션이_있으면_WebSocket_브로드캐스트를_하지_않는다() {
        User host = TestFixtures.user(HOST_ID);
        Session original = TestFixtures.endedSession(SESSION_ID, host);
        Session existing = TestFixtures.session(NEW_SESSION_ID, host);
        original.assignRenewedSession(existing);

        given(sessionRepository.findById(SESSION_ID)).willReturn(Optional.of(original));
        given(sessionRepository.findById(NEW_SESSION_ID)).willReturn(Optional.of(existing));

        sessionRenewService.renew(SESSION_ID, HOST_ID);

        then(sessionBroadcaster).shouldHaveNoInteractions();
    }
}
