package com.killnagi.domain.team.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@DisplayName("Team 엔티티 도메인 로직 테스트")
class TeamTest {

    private Team team;

    @BeforeEach
    void setUp() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        team = TestFixtures.team(session);
    }

    @Test
    void 팀_이름이_빈_문자열이면_예외가_발생한다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        assertThatThrownBy(() -> Team.builder().session(session).name("").build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 팀_이름이_null이면_예외가_발생한다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        assertThatThrownBy(() -> Team.builder().session(session).name(null).build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 초기_유효킬은_0이다() {
        assertThat(team.getEffectiveKills()).isEqualTo(0);
    }

    @Test
    void 킬_누적시_totalKills가_증가한다() {
        team.addKills(5);
        assertThat(team.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 킬을_여러번_누적하면_합산된다() {
        team.addKills(3);
        team.addKills(4);
        assertThat(team.getTotalKills()).isEqualTo(7);
    }

    @Test
    void 룰_보너스_추가시_유효킬이_증가한다() {
        team.addKills(5);
        team.addRuleScore(3);
        assertThat(team.getEffectiveKills()).isEqualTo(8);
    }

    @Test
    void 룰_패널티_추가시_유효킬이_감소한다() {
        team.addKills(5);
        team.addRuleScore(-2);
        assertThat(team.getEffectiveKills()).isEqualTo(3);
    }

    @Test
    void 유효킬은_총킬_더하기_룰스코어다() {
        team.addKills(10);
        team.addRuleScore(3);
        team.addRuleScore(-2);
        assertThat(team.getEffectiveKills()).isEqualTo(11);
    }

    @Test
    void 초기_팀은_리더가_없다() {
        assertThat(team.hasLeader()).isFalse();
        assertThat(team.getLeaderUserId()).isNull();
        assertThat(team.getLeaderNickname()).isNull();
    }

    @Test
    void 리더를_배정하면_hasLeader가_true가_된다() {
        User leader = TestFixtures.user(10L, "리더", "leader@test.com");
        team.assignLeader(leader);
        assertThat(team.hasLeader()).isTrue();
        assertThat(team.getLeaderUserId()).isEqualTo(10L);
        assertThat(team.getLeaderNickname()).isEqualTo("리더");
    }

    @Test
    void 리더를_해제하면_hasLeader가_false가_된다() {
        User leader = TestFixtures.user(10L, "리더", "leader@test.com");
        team.assignLeader(leader);
        team.unassignLeader();
        assertThat(team.hasLeader()).isFalse();
        assertThat(team.getLeaderUserId()).isNull();
    }

    @Test
    void 리더를_교체하면_새_리더로_변경된다() {
        User first = TestFixtures.user(10L, "첫번째", "first@test.com");
        User second = TestFixtures.user(11L, "두번째", "second@test.com");
        team.assignLeader(first);
        team.assignLeader(second);
        assertThat(team.getLeaderUserId()).isEqualTo(11L);
    }
}
