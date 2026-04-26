package com.killnagi.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "pubg_nickname", length = 100)
    private String pubgNickname;

    @Column(name = "pubg_player_id", length = 100)
    private String pubgPlayerId;

    // 전적 통계
    @Column(name = "total_sessions", nullable = false)
    private int totalSessions = 0;

    @Column(nullable = false)
    private int wins = 0;

    @Column(nullable = false)
    private int losses = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public User(String nickname, String email, String password, String pubgNickname, String pubgPlayerId) {
        this.nickname = nickname;
        this.email = email;
        this.password = password;
        this.pubgNickname = pubgNickname;
        this.pubgPlayerId = pubgPlayerId;
    }

    public void updatePubgInfo(String pubgNickname, String pubgPlayerId) {
        this.pubgNickname = pubgNickname;
        this.pubgPlayerId = pubgPlayerId;
    }

    public void recordWin() {
        this.totalSessions++;
        this.wins++;
    }

    public void recordLoss() {
        this.totalSessions++;
        this.losses++;
    }

    public double getWinRate() {
        if (totalSessions == 0) return 0.0;
        return (double) wins / totalSessions * 100;
    }

    public boolean hasId(Long userId) {
        return this.id != null && this.id.equals(userId);
    }
}
