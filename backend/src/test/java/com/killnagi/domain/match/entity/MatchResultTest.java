package com.killnagi.domain.match.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@DisplayName("MatchResult 엔티티 도메인 로직 테스트")
class MatchResultTest {

    private Match match;
    private TeamPlayer player;

    @BeforeEach
    void setUp() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        Team team = TestFixtures.team(session);
        match = TestFixtures.match(1L, session);
        player = TestFixtures.player(team);
    }

    @Test
    void 순위가_1이면_치킨이다() {
        MatchResult result = TestFixtures.matchResult(match, player, 3, 1);
        assertThat(result.isChicken()).isTrue();
    }

    @Test
    void 순위가_2이면_치킨이_아니다() {
        MatchResult result = TestFixtures.matchResult(match, player, 3, 2);
        assertThat(result.isChicken()).isFalse();
    }

    @Test
    void 순위가_null이면_치킨이_아니다() {
        MatchResult result = TestFixtures.matchResult(match, player, 3);
        assertThat(result.isChicken()).isFalse();
    }

    @Test
    void 킬수가_음수이면_예외가_발생한다() {
        assertThatThrownBy(() -> TestFixtures.matchResult(match, player, -1, 5))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 순위가_0이하이면_예외가_발생한다() {
        assertThatThrownBy(() -> TestFixtures.matchResult(match, player, 3, 0))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 순위가_10위_초과인데_TOP10이면_예외가_발생한다() {
        assertThatThrownBy(() -> MatchResult.builder()
                .match(match).teamPlayer(player).kills(3).placement(15).isTop10(true).build())
                .isInstanceOf(RuntimeException.class);
    }

}
