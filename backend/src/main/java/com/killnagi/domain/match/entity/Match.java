package com.killnagi.domain.match.entity;

import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.Rule.RuleType;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
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

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatchResult> results = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Match(Session session, Team team, int matchNumber, String screenshotUrl) {
        this.session = session;
        this.team = team;
        this.matchNumber = matchNumber;
        this.screenshotUrl = screenshotUrl;
    }

    public void confirm(List<MatchResult> matchResults, List<Rule> rules) {
        accumulateKills(matchResults);
        applyRules(matchResults, rules);
        this.status = MatchStatus.CONFIRMED;
    }

    private void accumulateKills(List<MatchResult> matchResults) {
        int totalKills = matchResults.stream().mapToInt(MatchResult::getKills).sum();
        this.team.addKills(totalKills);
        matchResults.forEach(matchResult -> matchResult.getTeamPlayer().addKills(matchResult.getKills()));
    }

    private void applyRules(List<MatchResult> matchResults, List<Rule> rules) {
        boolean isChicken = matchResults.stream().anyMatch(MatchResult::isChicken);
        long failedTop10Count = matchResults.stream().filter(matchResult -> !matchResult.isTop10()).count();

        for (Rule rule : rules) {
            if (rule.isType(RuleType.CHICKEN_BONUS) && isChicken) {
                this.team.addBonus(rule.getValue());
            } else if (rule.isType(RuleType.SURVIVAL_PENALTY) && failedTop10Count > 0) {
                this.team.addPenalty((int) failedTop10Count * rule.getValue());
            }
        }
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