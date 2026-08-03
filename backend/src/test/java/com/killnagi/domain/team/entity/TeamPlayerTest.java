package com.killnagi.domain.team.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("TeamPlayer 엔티티 도메인 로직 테스트")
class TeamPlayerTest {

    @Test
    void 닉네임이_빈_문자열이면_예외가_발생한다() {
        assertThatThrownBy(() -> TeamPlayer.builder().team(null).playerNickname("").build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 닉네임이_null이면_예외가_발생한다() {
        assertThatThrownBy(() -> TeamPlayer.builder().team(null).playerNickname(null).build())
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void 킬_추가시_totalKills가_누적된다() {
        TeamPlayer player = playerFixture();

        player.addKills(3);
        player.addKills(2);

        assertThat(player.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 킬_차감시_totalKills가_감소한다() {
        TeamPlayer player = playerFixture();

        player.addKills(5);
        player.subtractKills(2);

        assertThat(player.getTotalKills()).isEqualTo(3);
    }

    @Test
    void 초기_상태의_킬_수치는_모두_0이다() {
        TeamPlayer player = playerFixture();

        assertThat(player.getTotalKills()).isZero();
        assertThat(player.getBonusKills()).isZero();
        assertThat(player.getPenaltyKills()).isZero();
        assertThat(player.getEffectiveKills()).isZero();
    }

    @Test
    void 닉네임_수정시_playerNickname이_변경된다() {
        TeamPlayer player = playerFixture();

        player.updateNickname("NewNick");

        assertThat(player.getPlayerNickname()).isEqualTo("NewNick");
    }

    private TeamPlayer playerFixture() {
        return TeamPlayer.builder()
                .team(null)
                .playerNickname("TestPlayer")
                .build();
    }
}
