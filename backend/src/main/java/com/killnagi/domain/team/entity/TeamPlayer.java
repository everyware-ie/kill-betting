package com.killnagi.domain.team.entity;

import com.killnagi.common.exception.KillnagiException;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_players")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class TeamPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "player_nickname", nullable = false, length = 100)
    private String playerNickname;

    @Column(name = "total_kills", nullable = false)
    private int totalKills = 0;

    @Column(name = "bonus_kills", nullable = false)
    private int bonusKills = 0;

    @Column(name = "penalty_kills", nullable = false)
    private int penaltyKills = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public TeamPlayer(Team team, String playerNickname) {
        validate(playerNickname);
        this.team = team;
        this.playerNickname = playerNickname;
    }

    private void validate(String playerNickname) {
        if (playerNickname == null || playerNickname.isBlank()) {
            throw KillnagiException.badRequest("플레이어 닉네임은 비어있을 수 없습니다.");
        }
    }

    public boolean hasNickname(String nickname) {
        return this.playerNickname.equals(nickname);
    }

    public void updateNickname(String playerNickname) {
        this.playerNickname = playerNickname;
    }

    public void addKills(int kills) {
        this.totalKills += kills;
    }

    public void subtractKills(int kills) {
        this.totalKills -= kills;
    }

    public int getEffectiveKills() {
        return totalKills + bonusKills - penaltyKills;
    }

    public Long getTeamId() {
        return this.team.getId();
    }
}
