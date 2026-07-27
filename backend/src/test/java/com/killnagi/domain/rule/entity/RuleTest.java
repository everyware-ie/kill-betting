package com.killnagi.domain.rule.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("룰 점수 계산")
class RuleTest {

    private Rule rule(RuleType type, int value) {
        return Rule.builder()
                .ruleType(type)
                .operator(type == RuleType.CHICKEN_BONUS ? Operator.PLUS : Operator.MINUS)
                .value(value)
                .build();
    }

    @Nested
    @DisplayName("치킨 보너스 룰")
    class ChickenBonus {

        @Test
        @DisplayName("치킨을 달성하면 value만큼 보너스를 준다")
        void 치킨을_달성하면_value만큼_보너스를_준다() {
            Rule rule = rule(RuleType.CHICKEN_BONUS, 5);

            int score = rule.calculateScore(true, 0);

            assertThat(score).isEqualTo(5);
        }

        @Test
        @DisplayName("치킨을 달성하지 못하면 0점이다")
        void 치킨을_달성하지_못하면_0점이다() {
            Rule rule = rule(RuleType.CHICKEN_BONUS, 5);

            int score = rule.calculateScore(false, 3);

            assertThat(score).isZero();
        }
    }

    @Nested
    @DisplayName("인당 생존 패널티 룰(SURVIVAL_PENALTY)")
    class SurvivalPenalty {

        @Test
        @DisplayName("TOP10 실패 인원 수만큼 value를 곱해 감점한다")
        void TOP10_실패_인원_수만큼_value를_곱해_감점한다() {
            Rule rule = rule(RuleType.SURVIVAL_PENALTY, 2);

            int score = rule.calculateScore(false, 3);

            assertThat(score).isEqualTo(-6);
        }

        @Test
        @DisplayName("TOP10 실패자가 없으면 0점이다")
        void TOP10_실패자가_없으면_0점이다() {
            Rule rule = rule(RuleType.SURVIVAL_PENALTY, 2);

            int score = rule.calculateScore(false, 0);

            assertThat(score).isZero();
        }
    }

    @Nested
    @DisplayName("팀 생존 패널티 룰(TEAM_SURVIVAL_PENALTY)")
    class TeamSurvivalPenalty {

        @Test
        @DisplayName("TOP10 실패자가 1명이라도 있으면 인원 수와 무관하게 value만큼 1회 감점한다")
        void TOP10_실패자가_1명이라도_있으면_value만큼_1회_감점한다() {
            Rule rule = rule(RuleType.TEAM_SURVIVAL_PENALTY, 3);

            int score = rule.calculateScore(false, 4);

            assertThat(score).isEqualTo(-3);
        }

        @Test
        @DisplayName("TOP10 실패자가 없으면 0점이다")
        void TOP10_실패자가_없으면_0점이다() {
            Rule rule = rule(RuleType.TEAM_SURVIVAL_PENALTY, 3);

            int score = rule.calculateScore(false, 0);

            assertThat(score).isZero();
        }
    }
}
