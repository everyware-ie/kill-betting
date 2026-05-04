package com.killnagi.domain.match.entity;

import com.killnagi.common.exception.KillnagiException;
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

    private static final int MIN_KILLS = 0;
    private static final int MIN_PLACEMENT = 1;
    private static final int TOP10_MAX_PLACEMENT = 10;
    private static final int CHICKEN_PLACEMENT = 1;

    @Builder
    public MatchResult(Match match, TeamPlayer teamPlayer, int kills, Integer placement, boolean isTop10) {
        validate(kills, placement, isTop10);
        this.match = match;
        this.teamPlayer = teamPlayer;
        this.kills = kills;
        this.placement = placement;
        this.isChicken = placement != null && placement == CHICKEN_PLACEMENT;
        this.isTop10 = isTop10;
    }

    private void validate(int kills, Integer placement, boolean isTop10) {
        if (kills < MIN_KILLS) {
            throw KillnagiException.badRequest("킬 수는 0 이상이어야 합니다.");
        }
        if (placement != null && placement < MIN_PLACEMENT) {
            throw KillnagiException.badRequest("순위는 1 이상이어야 합니다.");
        }
        if (placement != null && placement > TOP10_MAX_PLACEMENT && isTop10) {
            throw KillnagiException.badRequest("순위가 10위 초과이면 TOP10일 수 없습니다.");
        }
    }
}
