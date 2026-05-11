package com.killnagi.domain.session.dto.response;

import com.killnagi.domain.rule.entity.Operator;
import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.rule.entity.RuleType;

public record RuleResponse(
        Long id,
        RuleType ruleType,
        Operator operator,
        int value
) {

    public static RuleResponse from(Rule rule) {
        return new RuleResponse(
                rule.getId(),
                rule.getRuleType(),
                rule.getOperator(),
                rule.getValue()
        );
    }
}