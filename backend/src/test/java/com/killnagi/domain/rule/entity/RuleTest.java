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

            int score = rule.calculateScore(true, 0, false);

            assertThat(score).isEqualTo(5);
        }

        @Test
        @DisplayName("치킨을 달성하지 못하면 0점이다")
        void 치킨을_달성하지_못하면_0점이다() {
            Rule rule = rule(RuleType.CHICKEN_BONUS, 5);

            int score = rule.calculateScore(false, 3, false);

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

            int score = rule.calculateScore(false, 3, false);

            assertThat(score).isEqualTo(-6);
        }

        @Test
        @DisplayName("TOP10 실패자가 없으면 0점이다")
        void TOP10_실패자가_없으면_0점이다() {
            Rule rule = rule(RuleType.SURVIVAL_PENALTY, 2);

            int score = rule.calculateScore(false, 0, false);

            assertThat(score).isZero();
        }
    }

    @Nested
    @DisplayName("팀 생존 패널티 룰(TEAM_SURVIVAL_PENALTY)")
    class TeamSurvivalPenalty {

        @Test
        @DisplayName("팀원 전원이 TOP10에 실패하면 인원 수와 무관하게 value만큼 1회 감점한다")
        void 팀원_전원이_TOP10에_실패하면_value만큼_1회_감점한다() {
            Rule rule = rule(RuleType.TEAM_SURVIVAL_PENALTY, 3);

            int score = rule.calculateScore(false, 4, true);

            assertThat(score).isEqualTo(-3);
        }

        @Test
        @DisplayName("한 명이라도 TOP10에 성공하면 감점하지 않는다")
        void 한_명이라도_TOP10에_성공하면_감점하지_않는다() {
            Rule rule = rule(RuleType.TEAM_SURVIVAL_PENALTY, 3);

            int score = rule.calculateScore(false, 1, false);

            assertThat(score).isZero();
        }

        @Test
        @DisplayName("TOP10 실패자가 없으면 0점이다")
        void TOP10_실패자가_없으면_0점이다() {
            Rule rule = rule(RuleType.TEAM_SURVIVAL_PENALTY, 3);

            int score = rule.calculateScore(false, 0, false);

            assertThat(score).isZero();
        }
    }
}
