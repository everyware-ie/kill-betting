//package com.killnagi.domain.rule.entity.strategy;
//
//import com.killnagi.domain.match.entity.MatchResult;
//import com.killnagi.domain.rule.entity.Rule;
//
//public class ChickenBonusRuleStrategy implements RuleStrategy {
//
//    @Override
//    public int apply(MatchResult matchResult, Rule rule, int currentScore) {
//        if (matchResult.isChicken()) {
//            return currentScore + rule.get();
//        }
//
//        return currentScore;
//    }
//}
