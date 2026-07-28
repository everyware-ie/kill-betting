/**
 * SessionDetailResponse → 프론트 rule 객체 변환
 */
export function mapSessionRule(session) {
  const findRule = (type) => (session.rules || []).find((r) => r.ruleType === type);
  const chickenBonus = findRule('CHICKEN_BONUS');
  const survivalPenalty = findRule('SURVIVAL_PENALTY');
  const teamSurvivalPenalty = findRule('TEAM_SURVIVAL_PENALTY');

  // 생존 패널티는 두 방식 중 하나만 활성화된다 (백엔드에서 택일 강제)
  const penaltyMode = survivalPenalty ? 'PER_PLAYER' : teamSurvivalPenalty ? 'TEAM_ONCE' : 'NONE';

  return {
    gameMode: '스쿼드',
    targetKills: session.targetKills ?? 20,
    noTimeLimit: session.timeLimitMinutes == null,
    timeLimitMin: session.timeLimitMinutes ?? 60,
    chickenBonusOn: !!chickenBonus,
    chickenBonus: chickenBonus?.value ?? 0,
    chickenBonusRuleId: chickenBonus?.id ?? null,
    penaltyMode,
    survivalPenalty: survivalPenalty?.value ?? 1,
    survivalPenaltyRuleId: survivalPenalty?.id ?? null,
    teamSurvivalPenalty: teamSurvivalPenalty?.value ?? 3,
    teamSurvivalPenaltyRuleId: teamSurvivalPenalty?.id ?? null,
  };
}

