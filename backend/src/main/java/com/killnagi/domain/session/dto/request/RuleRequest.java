package com.killnagi.domain.session.dto.request;

import com.killnagi.domain.rule.entity.RuleType;

public record RuleRequest(
        RuleType ruleType,
        int killValue
) {}
