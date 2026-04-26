package com.killnagi.domain.match.entity;

import com.killnagi.domain.team.entity.TeamMember;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_results")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_member_id", nullable = false)
    private TeamMember teamMember;

    @Column(nullable = false)
    private int kills;

    @Column(name = "placement")
    private Integer placement;

    @Column(name = "is_chicken", nullable = false)
    private boolean isChicken = false;

    @Column(name = "bonus_kills", nullable = false)
    private int bonusKills = 0;

    @Column(name = "penalty_kills", nullable = false)
    private int penaltyKills = 0;

    @Builder
    public MatchResult(Match match, TeamMember teamMember, int kills, Integer placement) {
        this.match = match;
        this.teamMember = teamMember;
        this.kills = kills;
        this.placement = placement;
        this.isChicken = placement != null && placement == 1;
    }

    public int getEffectiveKills() {
        return kills + bonusKills - penaltyKills;
    }

    public void applyBonus(int bonus) {
        this.bonusKills += bonus;
    }

    public void applyPenalty(int penalty) {
        this.penaltyKills += penalty;
    }
}
