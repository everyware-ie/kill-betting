package com.killnagi.domain.team.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
}
