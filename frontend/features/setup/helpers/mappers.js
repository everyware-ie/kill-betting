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
    survivalPenaltyOn: !!survivalPenalty,
    survivalPenalty: survivalPenalty?.value ?? 0,
    headShotBonusOn: false,
    headShotBonus: 0,
    assistBonusOn: false,
    assistBonus: 0,
    teamKillPenaltyOn: false,
    teamKillPenalty: 0,
    deathPenaltyOn: false,
    deathPenalty: 0,
  };
}

/**
 * ConfigureStateMessage → setup 페이지용 팀 데이터 변환
 */
export function mapConfigTeams(configState) {
  return (configState.teams || []).map((t) => ({
    id: t.teamId,
    name: t.teamName,
    members: t.leaderUserId
      ? [{ userId: t.leaderUserId, username: t.leaderNickname, role: 'LEADER' }]
      : [],
    players: (t.players || []).map((p) => p.playerNickname),
  }));
}

/**
 * ConfigureStateMessage → 참가자 목록 변환
 */
export function mapConfigParticipants(configState, hostUserId) {
  const leaders = (configState.teams || [])
    .filter((t) => t.leaderUserId)
    .map((t) => ({
      userId: t.leaderUserId,
      username: t.leaderNickname,
      role: t.leaderUserId === hostUserId ? 'HOST' : 'MEMBER',
    }));

  const waiting = (configState.waitingUsers || []).map((u) => ({
    userId: u.userId,
    username: u.nickname,
    role: u.userId === hostUserId ? 'HOST' : 'MEMBER',
  }));

  return [...leaders, ...waiting];
}