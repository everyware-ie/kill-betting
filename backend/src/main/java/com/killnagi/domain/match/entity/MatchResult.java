package com.killnagi.domain.match.entity;

import com.killnagi.domain.team.entity.TeamPlayer;
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
    @JoinColumn(name = "team_player_id", nullable = false)
    private TeamPlayer teamPlayer;

    @Column(nullable = false)
    private int kills;

    @Column(name = "placement")
    private Integer placement;

    @Column(name = "is_chicken", nullable = false)
    private boolean isChicken = false;

    @Column(name = "is_top10", nullable = false)
    private boolean isTop10 = false;

    @Builder
    public MatchResult(Match match, TeamPlayer teamPlayer, int kills, Integer placement, boolean isTop10) {
        this.match = match;
        this.teamPlayer = teamPlayer;
        this.kills = kills;
        this.placement = placement;
        this.isChicken = placement != null && placement == 1;
        this.isTop10 = isTop10;
    }
}
