import { describe, it, expect } from 'vitest';
import { groupMatchesByTeam } from './matchGrouping';

describe('팀별 매치 그룹화', () => {
  it('여러 팀 매치가 섞여 있으면 팀별로 정확히 분리된다', () => {
    const teams = [
      { id: 1, name: 'A팀' },
      { id: 2, name: 'B팀' },
    ];
    const matches = [
      { matchId: 10, teamId: 1, teamName: 'A팀' },
      { matchId: 11, teamId: 2, teamName: 'B팀' },
      { matchId: 12, teamId: 1, teamName: 'A팀' },
    ];

    const groups = groupMatchesByTeam(matches, teams);

    expect(groups.find((g) => g.teamId === 1).matches.map((m) => m.matchId)).toEqual([10, 12]);
    expect(groups.find((g) => g.teamId === 2).matches.map((m) => m.matchId)).toEqual([11]);
  });

  it('그룹 순서는 teams 배열 순서(팀 생성 순서)를 따른다', () => {
    const teams = [
      { id: 3, name: 'C팀' },
      { id: 1, name: 'A팀' },
      { id: 2, name: 'B팀' },
    ];
    const matches = [];

    const groups = groupMatchesByTeam(matches, teams);

    expect(groups.map((g) => g.teamId)).toEqual([3, 1, 2]);
  });

  it('매치가 없는 팀도 빈 배열로 그룹에 포함된다', () => {
    const teams = [
      { id: 1, name: 'A팀' },
      { id: 2, name: 'B팀' },
    ];
    const matches = [{ matchId: 10, teamId: 1, teamName: 'A팀' }];

    const groups = groupMatchesByTeam(matches, teams);

    expect(groups.find((g) => g.teamId === 2).matches).toEqual([]);
  });

  it('그룹 내부 매치 순서는 입력 matches 순서 그대로 유지된다', () => {
    const teams = [{ id: 1, name: 'A팀' }];
    const matches = [
      { matchId: 30, teamId: 1, teamName: 'A팀' },
      { matchId: 10, teamId: 1, teamName: 'A팀' },
      { matchId: 20, teamId: 1, teamName: 'A팀' },
    ];

    const groups = groupMatchesByTeam(matches, teams);

    expect(groups[0].matches.map((m) => m.matchId)).toEqual([30, 10, 20]);
  });
});