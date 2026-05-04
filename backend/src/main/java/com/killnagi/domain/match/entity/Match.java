package com.killnagi.domain.match.entity;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "match_number", nullable = false)
    private int matchNumber;

    @Column(name = "screenshot_url")
    private String screenshotUrl;

    @Column(name = "map_name", length = 50)
    private String mapName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status = MatchStatus.PENDING;

    @Column(name = "is_chicken", nullable = false)
    private boolean isChicken = false;

    @Column(name = "failed_top10_count", nullable = false)
    private long failedTop10Count = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private static final int MIN_MATCH_NUMBER = 1;

    @Builder
    public Match(Session session, Team team, int matchNumber, String screenshotUrl) {
        validate(matchNumber);
        this.session = session;
        this.team = team;
        this.matchNumber = matchNumber;
        this.screenshotUrl = screenshotUrl;
    }

    private void validate(int matchNumber) {
        if (matchNumber < MIN_MATCH_NUMBER) {
            throw KillnagiException.badRequest("매치 번호는 1 이상이어야 합니다.");
        }
    }

    public void confirm(List<MatchResult> matchResults, List<Rule> rules, boolean isChicken) {
        if (!isConfirmable()) {
            throw KillnagiException.badRequest("이미 확정된 매치는 다시 확정할 수 없습니다.");
        }

        accumulateKills(matchResults);
        computeMatchStats(matchResults, isChicken);
        applyRules(rules);
        this.status = MatchStatus.CONFIRMED;
    }

    private void accumulateKills(List<MatchResult> matchResults) {
        int totalKills = matchResults.stream().mapToInt(MatchResult::getKills).sum();
        this.team.addKills(totalKills);
        matchResults.forEach(matchResult -> matchResult.getTeamPlayer().addKills(matchResult.getKills()));
    }

    private void computeMatchStats(List<MatchResult> matchResults, boolean isChicken) {
        this.isChicken = isChicken;
        this.failedTop10Count = matchResults.stream().filter(r -> !r.isTop10()).count();
    }

    private void applyRules(List<Rule> rules) {
        rules.forEach(rule -> this.team.addRuleScore(rule.calculateScore(this.isChicken, this.failedTop10Count)));
    }

    public void updateScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public boolean isConfirmable() {
        return this.status == MatchStatus.PENDING;
    }

    public boolean isConfirmed() {
        return this.status == MatchStatus.CONFIRMED;
    }
}
