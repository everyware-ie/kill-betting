package com.killnagi.domain.team.entity;

import com.killnagi.common.exception.KillnagiException;
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

    @Column(name = "rule_score", nullable = false)
    private int ruleScore = 0;

    @Column(name = "adjustment_score", nullable = false)
    private int adjustmentScore = 0;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamPlayer> players = new ArrayList<>();

    @Builder
    public Team(Session session, String name) {
        validate(name);
        this.session = session;
        this.name = name;
    }

    private void validate(String name) {
        if (name == null || name.isBlank()) {
            throw KillnagiException.badRequest("팀 이름은 비어있을 수 없습니다.");
        }
    }

    public void assignLeader(User leader) {
        this.leader = leader;
    }

    public void unassignLeader() {
        this.leader = null;
    }

    public boolean hasLeader() {
        return this.leader != null;
    }

    public Long getLeaderUserId() {
        return this.leader != null ? this.leader.getId() : null;
    }

    public String getLeaderNickname() {
        return this.leader != null ? this.leader.getNickname() : null;
    }

    public int getEffectiveKills() {
        return totalKills + ruleScore + adjustmentScore;
    }

    public void addKills(int kills) {
        this.totalKills += kills;
    }

    public void addRuleScore(int score) {
        this.ruleScore += score;
    }

    public void applyAdjustment(int amount) {
        this.adjustmentScore += amount;
    }
}
