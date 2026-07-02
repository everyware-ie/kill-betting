export function calcTeamScore(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;
  for (const m of matches) {
    const teamResults = (m.memberResults || []).filter((r) => r.teamId === teamId);
    if (teamResults.length === 0) continue;
    const hasChicken = teamResults.some((r) => r.isChicken);
    if (rule.chickenBonusOn && hasChicken) bonus += rule.chickenBonus;
    for (const r of teamResults) {
      kills += r.kills;
      if (rule.survivalPenaltyOn && !r.isTop10) penalty += rule.survivalPenalty;
    }
  }
  const adj = adjustments
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);
  return { kills, bonus, penalty, adj, total: kills + bonus - penalty + adj };
}

export function calcPlayerStats(nick, matches, rule) {
  let kills = 0, bonus = 0, penalty = 0, damage = 0;
  for (const m of matches) {
    for (const r of (m.memberResults || [])) {
      if (r.playerNickname !== nick) continue;
      kills  += r.kills;
      damage += r.damage || 0;
      if (rule.survivalPenaltyOn && !r.isTop10) penalty += rule.survivalPenalty;
    }
  }
  return { kills, bonus, penalty, damage, total: kills + bonus - penalty };
}

export const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
};

export const fmtMMSS = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};