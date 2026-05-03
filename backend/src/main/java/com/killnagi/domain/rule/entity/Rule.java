package com.killnagi.domain.rule.entity;

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
    @JoinColumn(name = "rule_set_id", nullable = false)
    private RuleSet ruleSet;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 50)
    private RuleType ruleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "operator", nullable = false, length = 10)
    private Operator operator;

    @Column(nullable = false)
    private int value;

    @Column(nullable = false)
    private boolean enabled = true;

    @Builder
    public Rule(RuleSet ruleSet, RuleType ruleType, Operator operator, int value) {
        this.ruleSet = ruleSet;
        this.ruleType = ruleType;
        this.operator = operator;
        this.value = value;
    }

    public enum RuleType {
        CHICKEN_BONUS,              // 치킨 달성 시 보너스
        SURVIVAL_PENALTY,           // TOP10 진입 실패 시 패널티
    }

    public enum Operator {
        EQ,   // ==
        GTE,  // >=
        LTE,  // <=
        GT,   // >
        LT    // <
    }
}