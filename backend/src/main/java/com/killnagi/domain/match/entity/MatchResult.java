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

    @Column(nullable = false)
    private int damage;

    @Column(nullable = false)
    private int assists;

    @Column(name = "is_top10", nullable = false)
    private boolean isTop10 = false;

    private static final int MIN_KILLS = 0;
    private static final int MIN_DAMAGE = 0;
    private static final int MIN_ASSISTS = 0;

    @Builder
    public MatchResult(Match match, TeamPlayer teamPlayer, int kills, int damage, int assists, boolean isTop10) {
        validate(kills, damage, assists);
        this.match = match;
        this.teamPlayer = teamPlayer;
        this.kills = kills;
        this.damage = damage;
        this.assists = assists;
        this.isTop10 = isTop10;
    }

    private void validate(int kills, int damage, int assists) {
        if (kills < MIN_KILLS) {
            throw KillnagiException.badRequest("킬 수는 0 이상이어야 합니다.");
        }
        if (damage < MIN_DAMAGE) {
            throw KillnagiException.badRequest("피해량은 0 이상이어야 합니다.");
        }
        if (assists < MIN_ASSISTS) {
            throw KillnagiException.badRequest("어시스트는 0 이상이어야 합니다.");
        }
    }
}
