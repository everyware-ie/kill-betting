package com.killnagi.domain.team.entity;

import com.killnagi.domain.session.entity.Session;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "operator_user_id")
    private Long operatorUserId;

    @Column(name = "total_kills", nullable = false)
    private int totalKills = 0;

    @Column(name = "bonus_kills", nullable = false)
    private int bonusKills = 0;

    @Column(name = "penalty_kills", nullable = false)
    private int penaltyKills = 0;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamPlayer> players = new ArrayList<>();

    @Builder
    public Team(Session session, String name) {
        this.session = session;
        this.name = name;
    }

    public void assignOperator(Long userId) {
        this.operatorUserId = userId;
    }

    public boolean hasOperator() {
        return this.operatorUserId != null;
    }

    public boolean isOperatedBy(Long userId) {
        return userId != null && userId.equals(this.operatorUserId);
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
}
