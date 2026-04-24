package com.killnagi.domain.match.entity;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamMember;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MatchResult 엔티티 도메인 로직 테스트")
class MatchResultTest {

    private Match match;
    private TeamMember member;

    @BeforeEach
    void setUp() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        Team team = TestFixtures.team(session);
        match = TestFixtures.match(1L, session);
        member = TestFixtures.member(team, host);
    }

    @Test
    void 순위가_1이면_치킨이다() {
        MatchResult result = TestFixtures.matchResult(match, member, 3, 1);
        assertThat(result.isChicken()).isTrue();
    }

    @Test
    void 순위가_2이면_치킨이_아니다() {
        MatchResult result = TestFixtures.matchResult(match, member, 3, 2);
        assertThat(result.isChicken()).isFalse();
    }

    @Test
    void 순위가_null이면_치킨이_아니다() {
        MatchResult result = TestFixtures.matchResult(match, member, 3);
        assertThat(result.isChicken()).isFalse();
    }

    @Test
    void 보너스_적용시_유효킬이_증가한다() {
        MatchResult result = TestFixtures.matchResult(match, member, 5, 3);
        result.applyBonus(2);
        assertThat(result.getEffectiveKills()).isEqualTo(7);
    }

    @Test
    void 패널티_적용시_유효킬이_감소한다() {
        MatchResult result = TestFixtures.matchResult(match, member, 5, 3);
        result.applyPenalty(2);
        assertThat(result.getEffectiveKills()).isEqualTo(3);
    }

    @Test
    void 유효킬은_킬_더하기_보너스_빼기_패널티다() {
        MatchResult result = TestFixtures.matchResult(match, member, 5, 3);
        result.applyBonus(2);
        result.applyPenalty(1);
        assertThat(result.getEffectiveKills()).isEqualTo(6);
    }
}