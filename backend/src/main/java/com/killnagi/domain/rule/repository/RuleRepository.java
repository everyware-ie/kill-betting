package com.killnagi.domain.rule.repository;

import com.killnagi.domain.rule.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RuleRepository extends JpaRepository<Rule, Long> {
    List<Rule> findByRuleSetIdAndEnabled(Long ruleSetId, boolean enabled);
    List<Rule> findByRuleSetSessionIdAndEnabled(Long sessionId, boolean enabled);
}