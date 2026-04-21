package com.killnagi.domain.session.entity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.WAITING;

    // 목표 설정
    @Column(name = "target_kills")
    private Integer targetKills;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    // 세션 결과
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

    @Builder
    public Session(String name, User host, Integer targetKills, Integer timeLimitMinutes) {
        this.name = name;
        this.host = host;
        this.targetKills = targetKills;
        this.timeLimitMinutes = timeLimitMinutes;
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
