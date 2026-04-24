package com.killnagi.domain.rule.entity;

import com.killnagi.domain.session.entity.Session;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Rule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 50)
    private RuleType ruleType;

    @Column(name = "kill_value", nullable = false)
    private int killValue;  // +N 또는 -N

    @Column(nullable = false)
    private boolean enabled = true;

    @Builder
    public Rule(Session session, RuleType ruleType, int killValue) {
        this.session = session;
        this.ruleType = ruleType;
        this.killValue = killValue;
    }
}
