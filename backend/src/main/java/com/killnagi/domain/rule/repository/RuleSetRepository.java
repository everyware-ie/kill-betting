package com.killnagi.domain.rule.repository;

import com.killnagi.domain.rule.entity.RuleSet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RuleSetRepository extends JpaRepository<RuleSet, Long> {
}