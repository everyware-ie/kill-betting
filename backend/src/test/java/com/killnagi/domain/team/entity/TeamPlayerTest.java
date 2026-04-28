package com.killnagi.domain.team.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TeamPlayer 엔티티 도메인 로직 테스트")
class TeamPlayerTest {

    @Test
    void 킬_추가시_totalKills가_누적된다() {
        TeamPlayer player = playerFixture();

        player.addKills(3);
        player.addKills(2);

        assertThat(player.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 보너스_추가시_bonusKills가_누적된다() {
        TeamPlayer player = playerFixture();

        player.addBonus(2);
        player.addBonus(1);

        assertThat(player.getBonusKills()).isEqualTo(3);
    }

    @Test
    void 패널티_추가시_penaltyKills가_누적된다() {
        TeamPlayer player = playerFixture();

        player.addPenalty(1);
        player.addPenalty(2);

        assertThat(player.getPenaltyKills()).isEqualTo(3);
    }

    @Test
    void 유효킬수는_totalKills에_보너스를_더하고_패널티를_뺀다() {
        TeamPlayer player = playerFixture();
        player.addKills(10);
        player.addBonus(3);
        player.addPenalty(1);

        assertThat(player.getEffectiveKills()).isEqualTo(12);
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
