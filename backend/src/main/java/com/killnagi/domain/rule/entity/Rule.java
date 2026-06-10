package com.killnagi.domain.rule.entity;

import com.killnagi.common.exception.KillnagiException;
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

    private static final int MIN_VALUE = 1;

    @Builder
    public Rule(RuleSet ruleSet, RuleType ruleType, Operator operator, int value) {
        validate(ruleType, operator, value);
        this.ruleSet = ruleSet;
        this.ruleType = ruleType;
        this.operator = operator;
        this.value = value;
    }

    private void validate(RuleType ruleType, Operator operator, int value) {
        if (ruleType == null) {
            throw KillnagiException.badRequest("룰 타입은 필수입니다.");
        }
        if (operator == null) {
            throw KillnagiException.badRequest("연산자는 필수입니다.");
        }
        if (value < MIN_VALUE) {
            throw KillnagiException.badRequest("룰 값은 1 이상이어야 합니다.");
        }
    }

    public boolean isType(RuleType type) {
        return this.ruleType == type;
    }

    public int calculateScore(boolean isChicken, long failedTop10Count, boolean anyTop10) {
        if (isType(RuleType.CHICKEN_BONUS) && isChicken) {
            return value;
        }
        if (isType(RuleType.SURVIVAL_PENALTY) && failedTop10Count > 0) {
            return -(int) failedTop10Count * value;
        }
        if (isType(RuleType.SQUAD_WIPE_PENALTY) && !anyTop10) {
            return -value;
        }
        return 0;
    }

    public void updateValue(int newValue) {
        if (newValue < MIN_VALUE) {
            throw KillnagiException.badRequest("룰 값은 1 이상이어야 합니다.");
        }
        this.value = newValue;
    }
}