package com.killnagi.domain.match.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.killnagi.domain.match.entity.Match.MatchConfirmData;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleType;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.team.entity.TeamPlayer;
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
    void 매치_번호가_0이하이면_예외가_발생한다() {
        User host = TestFixtures.user(1L);
        Session session = TestFixtures.session(host);
        Team team = TestFixtures.team(session);
        assertThatThrownBy(() -> Match.builder().session(session).team(team).matchNumber(0).build())
                .isInstanceOf(RuntimeException.class);
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
        match.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null));
        assertThat(match.isConfirmed()).isTrue();
    }

    @Test
    void confirm_이후_매치는_다시_확정할_수_없다() {
        match.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null));
        assertThat(match.isConfirmable()).isFalse();
    }

    @Test
    void 이미_확정된_매치를_다시_confirm하면_예외가_발생한다() {
        match.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null));
        assertThatThrownBy(() -> match.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null)))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 확정되지_않은_매치는_삭제할_수_없다() {
        assertThatThrownBy(() -> match.delete(List.of()))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void delete_호출시_상태가_DELETED로_변경된다() {
        match.confirm(List.of(), List.of(), new MatchConfirmData(false, null, 0, null));

        match.delete(List.of());

        assertThat(match.getStatus()).isEqualTo(MatchStatus.DELETED);
    }

    @Test
    void delete_호출시_팀의_누적_킬수와_룰점수가_역산된다() {
        Rule chickenBonus = TestFixtures.rule(match.getSession(), RuleType.CHICKEN_BONUS, 3);
        TeamPlayer player = TestFixtures.player(match.getTeam(), "PlayerOne");
        MatchResult result = TestFixtures.matchResult(match, player, 5);
        match.confirm(List.of(result), List.of(chickenBonus), new MatchConfirmData(true, "에란겔", 1, "20:00"));

        match.delete(List.of(result));

        assertThat(match.getTeam().getTotalKills()).isZero();
        assertThat(match.getTeam().getRuleScore()).isZero();
    }

    @Test
    void delete_호출시_팀원의_누적_킬수가_역산된다() {
        TeamPlayer player = TestFixtures.player(match.getTeam(), "PlayerOne");
        MatchResult result = TestFixtures.matchResult(match, player, 5);
        match.confirm(List.of(result), List.of(), new MatchConfirmData(false, null, 0, null));

        match.delete(List.of(result));

        assertThat(player.getTotalKills()).isZero();
    }
}
