package com.killnagi.domain.session.entity;

import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionTest {

    @Test
    @DisplayName("세션 생성 시 상태는 WAITING이다")
    void 세션_생성시_상태는_WAITING이다() {
        Session session = sessionWithRoomUrl("abc-123");

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.WAITING);
    }

    @Test
    @DisplayName("start() 호출 시 상태가 IN_PROGRESS로 변경된다")
    void start_호출시_상태가_IN_PROGRESS로_변경된다() {
        Session session = sessionWithRoomUrl("abc-123");

        session.start();

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.IN_PROGRESS);
        assertThat(session.getStartedAt()).isNotNull();
    }

    @Test
    @DisplayName("end() 호출 시 상태가 ENDED로 변경된다")
    void end_호출시_상태가_ENDED로_변경된다() {
        Session session = sessionWithRoomUrl("abc-123");

        session.end(null);

        assertThat(session.getStatus()).isEqualTo(Session.SessionStatus.ENDED);
        assertThat(session.getEndedAt()).isNotNull();
    }

    @Test
    @DisplayName("assignCurrentRuleSet() 호출 시 currentRuleSet이 설정된다")
    void assignCurrentRuleSet_호출시_currentRuleSet이_설정된다() {
        Session session = sessionWithRoomUrl("abc-123");
        RuleSet ruleSet = RuleSet.builder().session(session).build();

        session.assignCurrentRuleSet(ruleSet);

        assertThat(session.getCurrentRuleSet()).isEqualTo(ruleSet);
    }

    @Test
    @DisplayName("isHostedBy()는 영속화 전 호스트는 어떤 ID와도 일치하지 않는다")
    void isHostedBy_영속화전_호스트는_어떤ID와도_일치하지_않는다() {
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