export function getPlayerDamage(nickname, matches) {
  let damage = 0;
  for (const m of matches) {
    for (const r of (m.memberResults || [])) {
      if (r.playerNickname === nickname) damage += r.damage || 0;
    }
  }
  return damage;
}

export function buildTeamScores(scoreboard) {
  if (!scoreboard) return [];
  return [...scoreboard.teams]
    .map((t) => ({
      id:           t.teamId,
      name:         t.teamName,
      leaderUserId: t.leaderUserId ?? null,
      kills:        t.totalKills,
      bonus:        Math.max(0, t.ruleScore),
      penalty:      Math.max(0, -t.ruleScore),
      adj:          t.adjustmentScore ?? 0,
      total:        t.effectiveKills,
      members:      t.members || [],
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildPlayerStats(scoreboard, matches) {
  return (scoreboard?.teams || [])
    .flatMap((t) =>
      (t.members || []).map((m) => ({
        nick:     m.playerNickname,
        teamName: t.teamName,
        kills:    m.totalKills,
        bonus:    m.bonusKills,
        penalty:  m.penaltyKills,
        total:    m.effectiveKills,
        damage:   getPlayerDamage(m.playerNickname, matches),
      }))
    )
    .sort((a, b) => b.kills - a.kills);
}
