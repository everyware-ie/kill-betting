package com.killnagi.domain.rule.entity;

public enum RuleType {
    CHICKEN_BONUS,          // 치킨 달성 시 보너스
    SURVIVAL_PENALTY,       // TOP10 진입 실패 시 인당 패널티 (실패 인원 수 × value)
    TEAM_SURVIVAL_PENALTY;  // 팀원 전원이 TOP10 진입에 실패해야 팀 전체 1회 패널티 (value). 1명이라도 성공하면 패널티 없음

    public boolean isSurvivalPenalty() {
        return this == SURVIVAL_PENALTY || this == TEAM_SURVIVAL_PENALTY;
    }
}