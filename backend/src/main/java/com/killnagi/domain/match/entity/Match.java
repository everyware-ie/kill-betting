package com.killnagi.domain.match.entity;

import com.killnagi.domain.session.entity.Session;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(name = "match_number", nullable = false)
    private int matchNumber;

    @Column(name = "screenshot_url")
    private String screenshotUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status = MatchStatus.PENDING;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatchResult> results = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Match(Session session, int matchNumber, String screenshotUrl) {
        this.session = session;
        this.matchNumber = matchNumber;
        this.screenshotUrl = screenshotUrl;
    }

    public void confirm() {
        this.status = MatchStatus.CONFIRMED;
    }

    public void updateScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public enum MatchStatus {
        PENDING, CONFIRMED
    }
}
