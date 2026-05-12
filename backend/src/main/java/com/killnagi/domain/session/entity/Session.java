package com.killnagi.domain.session.entity;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.RuleSet;
import com.killnagi.domain.team.entity.Team;
import com.killnagi.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "room_url", nullable = false, unique = true, length = 36)
    private String roomUrl;

    @Column(name = "room_code", nullable = false, unique = true, length = 6)
    private String roomCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.WAITING;

    @Column(name = "target_kills")
    private Integer targetKills;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    // 세션 생성 후 반드시 설정된다 — 생성 트랜잭션 내에서 assignCurrentRuleSet() 호출 필요
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_rule_set_id")
    private RuleSet currentRuleSet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_team_id")
    private Team winnerTeam;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private static final int MIN_TARGET_KILLS = 1;
    private static final int MIN_TIME_LIMIT_MINUTES = 1;

    @Builder
    public Session(String name, String roomUrl, String roomCode, User host, Integer targetKills, Integer timeLimitMinutes) {
        validate(name, targetKills, timeLimitMinutes);
        this.name = name;
        this.roomUrl = roomUrl;
        this.roomCode = roomCode;
        this.host = host;
        this.targetKills = targetKills;
        this.timeLimitMinutes = timeLimitMinutes;
    }

    private void validate(String name, Integer targetKills, Integer timeLimitMinutes) {
        if (name == null || name.isBlank()) {
            throw KillnagiException.badRequest("세션 이름은 비어있을 수 없습니다.");
        }
        if (targetKills != null && targetKills < MIN_TARGET_KILLS) {
            throw KillnagiException.badRequest("목표 킬 수는 1 이상이어야 합니다.");
        }
        if (timeLimitMinutes != null && timeLimitMinutes < MIN_TIME_LIMIT_MINUTES) {
            throw KillnagiException.badRequest("제한 시간은 1분 이상이어야 합니다.");
        }
    }

    public void assignCurrentRuleSet(RuleSet ruleSet) {
        this.currentRuleSet = ruleSet;
    }

    public void start() {
        this.status = SessionStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
    }

    public void end(Team winnerTeam) {
        this.status = SessionStatus.ENDED;
        this.winnerTeam = winnerTeam;
        this.endedAt = LocalDateTime.now();
    }

    public boolean isWaiting() {
        return this.status == SessionStatus.WAITING;
    }

    public boolean isInProgress() {
        return this.status == SessionStatus.IN_PROGRESS;
    }

    public boolean isExpired(LocalDateTime now) {
        if (timeLimitMinutes == null || startedAt == null) {
            return false;
        }
        return startedAt.plusMinutes(timeLimitMinutes).isBefore(now);
    }

    public boolean hasKillLimit() {
        return targetKills != null;
    }

    public boolean hasTimeLimit() {
        return timeLimitMinutes != null;
    }

    public LocalDateTime getExpiresAt() {
        return startedAt.plusMinutes(timeLimitMinutes);
    }

    public boolean isHostedBy(Long userId) {
        return this.host.hasId(userId);
    }

    public String getHostNickname() {
        return this.host.getNickname();
    }

    public enum SessionStatus {
        WAITING, IN_PROGRESS, ENDED
    }
}