package com.killnagi.domain.match.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.user.entity.User;
import com.killnagi.support.TestFixtures;

@DisplayName("Match 엔티티 상태 전이 테스트")
class MatchTest {

    private Match match;

    @BeforeEach
    void setUp() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        Team team = TestFixtures.team(session);
        match = TestFixtures.match(session, team);
        ReflectionTestUtils.setField(match, "id", 1L);
    }

    @Test
    void PENDING_상태의_매치는_확정_가능하다() {
        assertThat(match.isConfirmable()).isTrue();
    }

    @Test
    void PENDING_상태에서는_확정된_상태가_아니다() {
        assertThat(match.isConfirmed()).isFalse();
    }

    @Test
    void confirm_호출시_상태가_CONFIRMED로_변경된다() {
        match.confirm(List.of(), List.of(), false);
        assertThat(match.isConfirmed()).isTrue();
    }

    @Test
    void confirm_이후_매치는_다시_확정할_수_없다() {
        match.confirm(List.of(), List.of(), false);
        assertThat(match.isConfirmable()).isFalse();
    }

    @Test
    void 이미_확정된_매치를_다시_confirm하면_예외가_발생한다() {
        match.confirm(List.of(), List.of(), false);
        assertThatThrownBy(() -> match.confirm(List.of(), List.of(), false))
                .isInstanceOf(RuntimeException.class);
    }
}
