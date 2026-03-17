package com.killnagi.domain.rule.entity;

import com.killnagi.domain.session.entity.Session;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Rule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 50)
    private RuleType ruleType;

    @Column(name = "kill_value", nullable = false)
    private int killValue;  // +N 또는 -N

    @Column(nullable = false)
    private boolean enabled = true;

    @Builder
    public Rule(Session session, RuleType ruleType, int killValue) {
        this.session = session;
        this.ruleType = ruleType;
        this.killValue = killValue;
    }

    public enum RuleType {
        CHICKEN_BONUS,          // 치킨 달성 시 팀 전체 킬 수 +N
        SURVIVAL_PENALTY,       // TOP10 진입 실패 시 킬 수 -N
        CONSECUTIVE_DEATH_PENALTY, // 연속 사망 패널티
        PLACEMENT_BONUS         // 특정 순위 달성 보너스
    }
}
