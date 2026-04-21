package com.killnagi.domain.team.entity;

import com.killnagi.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_kills", nullable = false)
    private int totalKills = 0;

    @Column(name = "bonus_kills", nullable = false)
    private int bonusKills = 0;

    @Column(name = "penalty_kills", nullable = false)
    private int penaltyKills = 0;

    @Builder
    public TeamMember(Team team, User user) {
        this.team = team;
        this.user = user;
    }

    public int getEffectiveKills() {
        return totalKills + bonusKills - penaltyKills;
    }

    public void addKills(int kills) {
        this.totalKills += kills;
    }

    public void addBonus(int bonus) {
        this.bonusKills += bonus;
    }

    public void addPenalty(int penalty) {
        this.penaltyKills += penalty;
    }

    public Long getUserId() {
        return this.user.getId();
    }

    public String getUserNickname() {
        return this.user.getNickname();
    }

    public Long getTeamId() {
        return this.team.getId();
    }

    public String getTeamName() {
        return this.team.getName();
    }
}
