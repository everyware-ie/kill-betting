package com.killnagi.domain.session.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.user.entity.User;

class SessionTest {

    @Test
    void 세션_이름이_빈_문자열이면_예외가_발생한다() {
        assertThatThrownBy(() -> Session.builder().name("").host(hostUser()).build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 목표_킬_수가_0이하이면_예외가_발생한다() {
        assertThatThrownBy(() -> Session.builder().name("세션").host(hostUser()).targetKills(0).build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 제한_시간이_0이하이면_예외가_발생한다() {
        assertThatThrownBy(() -> Session.builder().name("세션").host(hostUser()).timeLimitMinutes(0).build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 세션_생성시_상태는_WAITING이다() {
        Session session = createSession();

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.WAITING);
    }

    @Test
    void 세션_시작시_상태가_IN_PROGRESS로_변경된다() {
        Session session = createSession();

        session.start();

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.IN_PROGRESS);
        assertThat(session.getStartedAt()).isNotNull();
    }

    @Test
    void 세션_종료시_상태가_ENDED로_변경된다() {
        Session session = createSession();

        session.end(null);

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.ENDED);
        assertThat(session.getEndedAt()).isNotNull();
    }

    @Test
    void 현재_룰셋_설정시_currentRuleSet이_적용된다() {
        Session session = createSession();
        RuleSet ruleSet = RuleSet.builder().session(session).build();

        session.assignCurrentRuleSet(ruleSet);

        assertThat(session.getCurrentRuleSet()).isEqualTo(ruleSet);
    }

    @Test
    void 영속화전_호스트ID는_어떤ID와도_일치하지_않는다() {
        User host = User.builder()
                .nickname("testHost")
                .email("host@test.com")
                .password("pw")
                .build();
        Session session = Session.builder()
                .name("테스트 세션")
                .host(host)
                .build();

        assertThat(session.isHostedBy(null)).isFalse();
        assertThat(session.isHostedBy(1L)).isFalse();
    }

    @Test
    void 소프트삭제하면_isDeleted가_true가_된다() {
        Session session = createSession();

        session.softDelete();

        assertThat(session.isDeleted()).isTrue();
    }

    @Test
    void 생성직후_세션은_삭제되지_않은_상태다() {
        Session session = createSession();

        assertThat(session.isDeleted()).isFalse();
    }

    @Test
    void 진행중_세션도_소프트삭제할_수_있다() {
        Session session = createSession();
        session.start();

        session.softDelete();

        assertThat(session.isDeleted()).isTrue();
    }

    private User hostUser() {
        return User.builder().nickname("host").email("host@test.com").password("pw").build();
    }

    private Session createSession() {
        return Session.builder()
                .name("테스트 세션")
                .host(User.builder()
                        .nickname("host")
                        .email("host@test.com")
                        .password("pw")
                        .build())
                .targetKills(10)
                .timeLimitMinutes(null)
                .build();
    }
}