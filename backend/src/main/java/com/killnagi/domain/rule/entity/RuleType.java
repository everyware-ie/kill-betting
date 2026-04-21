package com.killnagi.domain.rule.entity;


public enum RuleType {
    CHICKEN_BONUS("치킨 달성 보너스", Operator.ADD),
    SURVIVAL_PENALTY("생존 패널티", Operator.SUBTRACT),
    CONSECUTIVE_DEATH_PENALTY("연속 사망 패널티", Operator.SUBTRACT),
    PLACEMENT_BONUS("순위 보너스", Operator.ADD),
    ;

    private String description;
    private Operator operator;

    RuleType(String description, Operator operator) {
        this.description = description;
        this.operator = operator;
    }

    enum Operator {
        ADD, SUBTRACT, MULTIPLY, DIVIDE
    }
}
