package com.killnagi.domain.match.entity;

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
    void 킬수가_음수이면_예외가_발생한다() {
        assertThatThrownBy(() -> TestFixtures.matchResult(match, player, -1, 100, 0, false))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 피해량이_음수이면_예외가_발생한다() {
        assertThatThrownBy(() -> TestFixtures.matchResult(match, player, 3, -1, 0, false))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 어시스트가_음수이면_예외가_발생한다() {
        assertThatThrownBy(() -> TestFixtures.matchResult(match, player, 3, 100, -1, false))
                .isInstanceOf(RuntimeException.class);
    }
}