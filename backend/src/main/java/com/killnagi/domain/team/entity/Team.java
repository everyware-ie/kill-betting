package com.killnagi.domain.team.entity;

import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.user.entity.User;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_user_id")
    private User leader;

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

    public void assignLeader(User leader) {
        this.leader = leader;
    }

    public boolean hasLeader() {
        return this.leader != null;
    }

    public boolean isLedBy(Long userId) {
        return this.leader != null && this.leader.hasId(userId);
    }

    public Long getLeaderUserId() {
        return this.leader != null ? this.leader.getId() : null;
    }

    public String getLeaderNickname() {
        return this.leader != null ? this.leader.getNickname() : null;
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
