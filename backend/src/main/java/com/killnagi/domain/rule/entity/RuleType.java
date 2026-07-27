package com.killnagi.domain.rule.entity;

public enum RuleType {
    CHICKEN_BONUS,          // 치킨 달성 시 보너스
    SURVIVAL_PENALTY,       // TOP10 진입 실패 시 인당 패널티 (실패 인원 수 × value)
    TEAM_SURVIVAL_PENALTY;  // TOP10 진입 실패자가 1명이라도 있으면 팀 전체 1회 패널티 (value)

    public boolean isSurvivalPenalty() {
        return this == SURVIVAL_PENALTY || this == TEAM_SURVIVAL_PENALTY;
    }
}