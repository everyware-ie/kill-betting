/**
 * SessionDetailResponse → 프론트 rule 객체 변환
 */
export function mapSessionRule(session) {
  const findRule = (type) => (session.rules || []).find((r) => r.ruleType === type);
  const chickenBonus = findRule('CHICKEN_BONUS');
  const survivalPenalty = findRule('SURVIVAL_PENALTY');

  return {
    gameMode: '스쿼드',
    targetKills: session.targetKills ?? 20,
    noTimeLimit: session.timeLimitMinutes == null,
    timeLimitMin: session.timeLimitMinutes ?? 60,
    chickenBonusOn: !!chickenBonus,
    chickenBonus: chickenBonus?.value ?? 0,
    chickenBonusRuleId: chickenBonus?.id ?? null,
    survivalPenaltyOn: !!survivalPenalty,
    survivalPenalty: survivalPenalty?.value ?? 0,
    survivalPenaltyRuleId: survivalPenalty?.id ?? null,
    // 백엔드 미지원 — UI 기본값 유지
    headShotBonusOn: false,
    headShotBonus: 0,
    assistBonusOn: false,
    assistBonus: 0,
    teamKillPenaltyOn: false,
    teamKillPenalty: 0,
  };
}

