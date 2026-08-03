package com.killnagi.domain.match.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_deletion_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MatchDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "deleted_by_user_id", nullable = false)
    private Long deletedByUserId;

    @Column(name = "reverted_kills", nullable = false)
    private int revertedKills;

    @Column(name = "reverted_rule_score", nullable = false)
    private int revertedRuleScore;

    @CreatedDate
    @Column(name = "deleted_at", updatable = false)
    private LocalDateTime deletedAt;

    @Builder
    public MatchDeletionLog(Long matchId, Long teamId, Long deletedByUserId, int revertedKills, int revertedRuleScore) {
        this.matchId = matchId;
        this.teamId = teamId;
        this.deletedByUserId = deletedByUserId;
        this.revertedKills = revertedKills;
        this.revertedRuleScore = revertedRuleScore;
    }
}