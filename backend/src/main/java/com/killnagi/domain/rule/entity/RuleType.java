package com.killnagi.domain.rule.entity;

public enum RuleType {
    CHICKEN_BONUS,      // 치킨 달성 시 팀 보너스
    SURVIVAL_PENALTY,   // TOP10 진입 실패 개인마다 패널티
    SQUAD_WIPE_PENALTY  // 팀원 전원 TOP10 실패 시 팀 고정 패널티
}