package com.killnagi.domain.team.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TeamMemberTest {

    @Test
    @DisplayName("addKills 호출 시 totalKills가 누적된다")
    void addKills_호출시_totalKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addKills(3);
        member.addKills(2);

        assertThat(member.getTotalKills()).isEqualTo(5);
    }

    @Test
    @DisplayName("addBonus 호출 시 bonusKills가 누적된다")
    void addBonus_호출시_bonusKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addBonus(2);
        member.addBonus(1);

        assertThat(member.getBonusKills()).isEqualTo(3);
    }

    @Test
    @DisplayName("addPenalty 호출 시 penaltyKills가 누적된다")
    void addPenalty_호출시_penaltyKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addPenalty(1);
        member.addPenalty(2);

        assertThat(member.getPenaltyKills()).isEqualTo(3);
    }

    @Test
    @DisplayName("getEffectiveKills는 totalKills + bonusKills - penaltyKills를 반환한다")
    void getEffectiveKills_totalKills에_보너스를_더하고_패널티를_뺀다() {
        TeamMember member = teamMemberFixture();
        member.addKills(10);
        member.addBonus(3);
        member.addPenalty(1);

        assertThat(member.getEffectiveKills()).isEqualTo(12);
    }

    @Test
    @DisplayName("초기 상태의 모든 킬 수치는 0이다")
    void 초기_상태의_킬_수치는_모두_0이다() {
        TeamMember member = teamMemberFixture();

        assertThat(member.getTotalKills()).isZero();
        assertThat(member.getBonusKills()).isZero();
        assertThat(member.getPenaltyKills()).isZero();
        assertThat(member.getEffectiveKills()).isZero();
    }

    private TeamMember teamMemberFixture() {
        return TeamMember.builder()
                .team(null)
                .user(null)
                .build();
    }
}
