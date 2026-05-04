package com.killnagi.domain.session.dto.request;

import com.killnagi.domain.rule.entity.Operator;
import com.killnagi.domain.rule.entity.RuleType;
import jakarta.validation.constraints.NotNull;

public record RuleRequest(
        @NotNull(message = "룰 타입을 입력해주세요")
        RuleType ruleType,
        @NotNull(message = "연산자를 입력해주세요")
        Operator operator,
        int value
) {}