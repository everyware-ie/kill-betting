package com.killnagi.domain.rule.entity.strategy;

import com.killnagi.domain.match.entity.MatchResult;
import com.killnagi.domain.rule.entity.Rule;

public interface RuleStrategy {
    int apply(MatchResult matchResult, Rule rule, int currentScore);
}
