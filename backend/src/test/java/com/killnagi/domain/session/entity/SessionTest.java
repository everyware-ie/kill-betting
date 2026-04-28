package com.killnagi.domain.session.entity;

import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionTest {

    @Test
    void 세션_생성시_상태는_WAITING이다() {
        Session session = sessionWithRoomUrl("abc-123");

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.WAITING);
    }

    @Test
    void 세션_시작시_상태가_IN_PROGRESS로_변경된다() {
        Session session = sessionWithRoomUrl("abc-123");

        session.start();

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.IN_PROGRESS);
        assertThat(session.getStartedAt()).isNotNull();
    }

    @Test
    void 세션_종료시_상태가_ENDED로_변경된다() {
        Session session = sessionWithRoomUrl("abc-123");

        session.end(null);

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.ENDED);
        assertThat(session.getEndedAt()).isNotNull();
    }

    @Test
    void 현재_룰셋_설정시_currentRuleSet이_적용된다() {
        Session session = sessionWithRoomUrl("abc-123");
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
                .roomUrl("abc-123")
                .host(host)
                .build();

        assertThat(session.isHostedBy(null)).isFalse();
        assertThat(session.isHostedBy(1L)).isFalse();
    }

    private Session sessionWithRoomUrl(String roomUrl) {
        return Session.builder()
                .name("테스트 세션")
                .roomUrl(roomUrl)
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