export function groupMatchesByTeam(matches, teams) {
  return teams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    matches: matches.filter((match) => match.teamId === team.id),
  }));
}