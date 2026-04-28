package com.killnagi.domain.team.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TeamMemberTest {

    @Test
    void 킬_추가시_totalKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addKills(3);
        member.addKills(2);

        assertThat(member.getTotalKills()).isEqualTo(5);
    }

    @Test
    void 보너스_추가시_bonusKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addBonus(2);
        member.addBonus(1);

        assertThat(member.getBonusKills()).isEqualTo(3);
    }

    @Test
    void 패널티_추가시_penaltyKills가_누적된다() {
        TeamMember member = teamMemberFixture();

        member.addPenalty(1);
        member.addPenalty(2);

        assertThat(member.getPenaltyKills()).isEqualTo(3);
    }

    @Test
    void 유효킬수는_totalKills에_보너스를_더하고_패널티를_뺀다() {
        TeamMember member = teamMemberFixture();
        member.addKills(10);
        member.addBonus(3);
        member.addPenalty(1);

        assertThat(member.getEffectiveKills()).isEqualTo(12);
    }

    @Test
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
