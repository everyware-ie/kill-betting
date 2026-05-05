/**
 * ============================================================
 *  lib/room-api.js — 킬내기 방 API 레이어
 * ============================================================
 *
 *  [백엔드 개발자 가이드]
 *
 *  USE_MOCK = false 로 변경하면 실제 API 호출로 전환됩니다.
 *  (lib/api.js 와 동일한 방식)
 *
 *  [개념 정리]
 *
 *  room.participants  → 로그인해서 방에 들어온 유저 목록
 *  team.players       → 배그 닉네임 문자열 목록 (계정 연동 없음)
 *
 * ============================================================
 */

import { USE_MOCK } from '@/lib/api';
import {
  _runtimeRooms,
  createDefaultTeams,
  DEFAULT_RULE,
} from '@/mock/rooms';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  return res.json().catch(() => ({}));
}

const getStoredToken = () => {
  try { return sessionStorage.getItem('auth_token'); } catch { return null; }
};

const ok    = (data = {}) => ({ success: true, data });
const err   = (msg)       => ({ success: false, error: msg });
const delay = (ms = 300)  => new Promise((r) => setTimeout(r, ms));

/** 방 코드 생성 (예: #1234-56) */
const genCode = () =>
  `#${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`;

/**
 * 프론트엔드 rule 객체를 백엔드 RuleRequest[] 형식으로 변환
 * 백엔드 RuleType: CHICKEN_BONUS, SURVIVAL_PENALTY만 지원
 * 프론트: { chickenBonusOn: true, chickenBonus: 5, survivalPenaltyOn: true, survivalPenalty: 2 }
 * 백엔드: [{ ruleType: 'CHICKEN_BONUS', operator: 'PLUS', value: 5 }, ...]
 */
const convertRuleToBackend = (rule) => {
  const rules = [];

  if (rule.chickenBonusOn && rule.chickenBonus > 0) {
    rules.push({ ruleType: 'CHICKEN_BONUS', operator: 'PLUS', value: rule.chickenBonus });
  }
  if (rule.survivalPenaltyOn && rule.survivalPenalty > 0) {
    rules.push({ ruleType: 'SURVIVAL_PENALTY', operator: 'MINUS', value: rule.survivalPenalty });
  }

  return rules;
};

export const RoomAPI = {

  /**
   * 방 생성
   *
   * [실제 API]
   *   POST /sessions
   *   Body: { name, targetKills, timeLimitMinutes, rules }
   *   Response 201: { session: SessionResponse }
   *
   * [백엔드 요구 필드]
   *   name: 세션 이름 (required)
   *   targetKills: 목표 킬 수
   *   timeLimitMinutes: 제한 시간 (분) - null이면 제한 없음
   *   rules: [{ ruleType, operator, value }]
   */
  create: async (title, rule, hostUser) => {
    const hostUserId = typeof hostUser === 'object' ? hostUser.id : hostUser;
    const hostUsername = typeof hostUser === 'object' ? hostUser.username : hostUser;
    if (USE_MOCK) {
      await delay(400);
      if (!title.trim()) return err('방 제목을 입력해주세요');
      const room = {
        id:           `room-${Date.now()}`,
        title:        title.trim(),
        code:         genCode(),
        status:       'WAITING',
        rule:         { ...DEFAULT_RULE, ...rule },
        teams:        createDefaultTeams(),
        // 방 참여자: 방장이 자동으로 첫 참여자
        participants: [{ userId: hostUserId, username: hostUsername, role: 'HOST', joinedAt: new Date().toISOString() }],
        createdAt:    new Date().toISOString(),
      };
      _runtimeRooms.push(room);
      return ok({ room });
    }
    return apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        name: title.trim(),
        targetKills: rule.targetKills,
        timeLimitMinutes: rule.noTimeLimit ? null : rule.timeLimitMin,
        rules: convertRuleToBackend(rule),
      }),
    });
  },

  /**
   * 방 조회
   *
   * [실제 API]
   *   GET /sessions/join/{roomUrl}
   *   Response 200: { session }
   *   Response 404: { error: '방을 찾을 수 없습니다' }
   */
  get: async (roomUrl) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomUrl);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ room });
    }
    return apiFetch(`/sessions/join/${roomUrl}`);
  },

  /**
   * 팀 참여 (로그인 유저가 세션에 들어옴)
   *
   * [실제 API]
   *   POST /sessions/:sessionId/join
   *   Response 200: { ok }
   *
   * [동작]
   *   - 로그인 유저가 세션에 입장
   */
  joinTeam: async (roomId, teamId, user) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');

      // 이동할 팀에 이미 다른 유저가 있으면 불가 (팀당 1명 제한)
      const targetTeam = room.teams.find((t) => t.id === teamId);
      const alreadyOccupied = (targetTeam?.members || []).some((m) => m.userId !== user.id);
      if (alreadyOccupied) return err('이미 다른 팀원이 있는 팀입니다');

      // 기존 팀에서 제거
      room.teams = room.teams.map((t) => ({
        ...t,
        members: (t.members || []).filter((m) => m.userId !== user.id),
      }));

      // 새 팀에 추가 — 팀당 1명이므로 항상 LEADER
      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: [{
            userId:   user.id,
            username: user.username,
            role:     'LEADER',
          }],
        };
      });

      return ok({ teams: room.teams });
    }
    return apiFetch(`/sessions/${roomId}/join`, { method: 'POST' });
  },

  /**
   * 팀 나가기
   *
   * [실제 API]
   *   DELETE /sessions/:sessionId/leave
   *   Response 200: { ok }
   *
   * [동작]
   *   - 로그인 유저가 세션에서 퇴장
   */
  leaveTeam: async (roomId, teamId, userId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');

      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        const remaining = t.members.filter((m) => m.userId !== userId);
        // LEADER 없으면 첫 번째 MEMBER를 LEADER로 승격
        const hasLeader = remaining.some((m) => m.role === 'LEADER');
        if (!hasLeader && remaining.length > 0) {
          remaining[0] = { ...remaining[0], role: 'LEADER' };
        }
        return { ...t, members: remaining };
      });

      return ok({ teams: room.teams });
    }
    return apiFetch(`/sessions/${roomId}/leave`, { method: 'DELETE' });
  },

  /**
   * 리더(Leader) 위임
   *
   * [실제 API]
   *   PUT /sessions/:sessionId/teams/:teamId/leader
   *   Body: { userId: string }
   *   Response 200: { ok }
   *
   * [권한]
   *   현재 LEADER만 위임 가능
   */
  setLeader: async (roomId, teamId, newLeaderUserId) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');

      room.teams = room.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: t.members.map((m) => ({
            ...m,
            role: m.userId === newLeaderUserId ? 'LEADER' : 'MEMBER',
          })),
        };
      });

      return ok({ teams: room.teams });
    }
    return apiFetch(`/sessions/${roomId}/teams/${teamId}/leader`, {
      method: 'PUT',
      body: JSON.stringify({ userId: newLeaderUserId }),
    });
  },

  /**
   * 룰 수정 (팀 구성 화면에서 [룰 수정] 버튼 → 모달 → [저장하기])
   *
   * [실제 API]
   *   PUT /sessions/:sessionId/rule
   *   Body: { rule: RuleObject }
   *   Response 200: { rule }
   *
   * [NOTE] 백엔드 미구현 상태 - 추후 구현 예정
   */
  updateRule: async (roomId, rule) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.rule = { ...rule };
      return ok({ rule });
    }
    return apiFetch(`/sessions/${roomId}/rule`, {
      method: 'PUT',
      body: JSON.stringify({ rule }),
    });
  },

  /**
   * 팀 구성 업데이트 (닉네임 추가/삭제)
   *
   * [실제 API]
   *   PUT /sessions/:sessionId/teams
   *   Body: { teams: [{ id, name, players: string[] }] }
   *         players = 배그 닉네임 문자열 배열
   *   Response 200: { teams }
   *
   * [참고]
   *   players 는 배그 닉네임 문자열만 저장합니다.
   *   유저 계정과 연동하지 않습니다.
   */
  updateTeams: async (roomId, teams) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.teams = teams;
      return ok({ teams });
    }
    return apiFetch(`/sessions/${roomId}/teams`, {
      method: 'PUT',
      body: JSON.stringify({ teams }),
    });
  },

  /**
   * 팀 추가
   *
   * [실제 API]
   *   POST /sessions/:sessionId/teams
   *   Body: { name: "TEAM-ABC123" }  ← 랜덤 이름
   *   Response 201: { team }
   *
   * [제한] 최대 6팀
   */
  addTeam: async (roomId) => {
    // 랜덤 팀 이름 생성 (예: TEAM-A1B2C3)
    const generateRandomTeamName = () => {
      const NAMES = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'];
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${randomName}-${randomSuffix}`;
    };

    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (room.teams.length >= 6) return err('최대 6팀까지 가능합니다');
      const newTeam = {
        id:      `team-${Date.now()}`,
        name:    generateRandomTeamName(),
        players: [],
        members: [],   // ← 누락 시 joinTeam에서 t.members.filter() 오류 발생
      };
      room.teams.push(newTeam);
      return ok({ teams: room.teams });
    }
    return apiFetch(`/sessions/${roomId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name: generateRandomTeamName() }),
    });
  },

  /**
   * 매치 이미지 업로드 (이미지 기반 매치 결과 전송)
   *
   * [실제 API]
   *   POST /sessions/:sessionId/matches
   *   Body: FormData { image: File }
   *   Response 201: { screenshotUrl: string, matchResult: MatchResult }
   *
   * [동작]
   *   - 게임 결과 스크린샷을 이미지 파일로 업로드
   *   - 백엔드에서 OCR로 파싱해 매치 결과 반환
   *   - 반환된 결과를 사용자에게 보여주고 확정 버튼 클릭 시 POST /matches/{matchId}/confirm
   */
  addTeamMatch: async (roomId, teamId, results, claimsChicken) => {
    if (USE_MOCK) {
      await delay(250);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (!room.matches) room.matches = [];

      // 이 팀의 이전 제출 수 → 팀별 순번 계산
      const teamMatchNumber = room.matches.filter((m) => m.teamId === teamId).length + 1;

      const match = {
        id:              `match-${Date.now()}`,
        teamId,                                    // 제출한 팀 ID
        teamMatchNumber,                           // 팀별 매치 순번 (A팀 3번째 게임 등)
        results:         [...results],             // 이 팀 플레이어들의 결과
        chickenTeamId:   claimsChicken ? teamId : null,
        createdAt:       new Date().toISOString(),
      };
      room.matches.push(match);
      return ok({ match });
    }
    // FormData 기반 이미지 업로드
    const formData = new FormData();
    formData.append('image', results); // results가 File 객체
    const res = await fetch(`${API_BASE_URL}/sessions/${roomId}/matches`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json().catch(() => ({}));
  },

  /**
   * 매치 목록 조회
   *
   * [실제 API]
   *   GET /sessions/:sessionId/match-history
   *   Response 200: { matches: Match[] }
   *
   * [반환 데이터]
   *   각 match: { id, teamId, teamMatchNumber, results, chickenTeamId, createdAt }
   *   팀별로 독립 제출되므로 teamId로 필터링하면 해당 팀의 히스토리를 볼 수 있음
   */
  getMatches: async (roomId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ matches: room.matches || [] });
    }
    return apiFetch(`/sessions/${roomId}/match-history`);
  },

  /**
   * 매치 결과 스크린샷 업로드
   *
   * [실제 API]
   *   POST /rooms/:id/matches/:matchId/screenshot
   *   Body: FormData { screenshot: File }
   *   Response 200: { screenshotUrl: string }  ← S3 퍼블릭 URL
   *
   * [주의]
   *   - 이 API는 JSON이 아닌 multipart/form-data 로 전송합니다.
   *   - Content-Type 헤더를 직접 지정하지 말고 브라우저가 자동 설정하도록 두세요.
   *
   * [Mock 동작]
   *   - URL.createObjectURL() 로 로컬 임시 URL 생성 (브라우저 메모리에만 존재)
   *   - 실제 S3 업로드는 일어나지 않음
   */
  uploadMatchScreenshot: async (roomId, matchId, file) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const match = room.matches?.find((m) => m.id === matchId);
      if (!match) return err('매치를 찾을 수 없습니다');
      // Mock: 브라우저 메모리 임시 URL (S3 URL 역할)
      const screenshotUrl = URL.createObjectURL(file);
      match.screenshotUrl = screenshotUrl;
      return ok({ screenshotUrl });
    }
    // 실제 API: FormData 사용 (Content-Type 헤더 자동 설정)
    const formData = new FormData();
    formData.append('screenshot', file);
    const res = await fetch(`${API_BASE_URL}/sessions/${roomId}/matches/${matchId}/screenshot`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json().catch(() => ({}));
  },

  /**
   * 점수 수동 조정 (운영자 전용)
   *
   * [실제 API]
   *   POST /sessions/:sessionId/adjustments
   *   Body: { teamId, amount, reason }
   *   Response 200: { adjustments }
   *
   * [NOTE] 백엔드 미구현 상태 - 추후 구현 예정
   */
  addAdjustment: async (roomId, teamId, amount, reason) => {
    if (USE_MOCK) {
      await delay(200);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      if (!room.adjustments) room.adjustments = [];
      const adj = { id: `adj-${Date.now()}`, teamId, amount, reason, createdAt: new Date().toISOString() };
      room.adjustments.push(adj);
      return ok({ adjustments: room.adjustments });
    }
    return apiFetch(`/sessions/${roomId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify({ teamId, amount, reason }),
    });
  },

  /**
   * 킬내기 종료
   *
   * [실제 API]
   *   POST /sessions/:sessionId/end
   *   Response 200: { ok }
   *
   * [NOTE] 백엔드 미구현 상태 - 추후 구현 예정
   */
  end: async (roomId) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      room.status = 'DONE';
      room.endedAt = new Date().toISOString();
      return ok({ room });
    }
    return apiFetch(`/sessions/${roomId}/end`, { method: 'POST' });
  },

  /**
   * 방 참여자 목록 조회
   *
   * [실제 API]
   *   GET /sessions/:sessionId/participants
   *   Response 200: { configureState: ConfigureStateMessage }
   */
  getParticipants: async (roomId) => {
    if (USE_MOCK) {
      await delay(150);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      return ok({ participants: room.participants || [] });
    }
    return apiFetch(`/sessions/${roomId}/participants`);
  },

  /**
   * 내 방 목록 조회
   *
   * [실제 API]
   *   GET /sessions/my
   *   Response 200: { sessions: SessionResponse[] }
   *
   * [반환 데이터]
   *   sessions 배열 — 각 방의 id, title, status, createdAt, teams, rule 포함
   *   status: 'WAITING' | 'LIVE' | 'DONE'
   */
  list: async (userId) => {
    if (USE_MOCK) {
      await delay(200);
      // 내가 참여자(participants)로 있는 방만 필터링
      const myRooms = _runtimeRooms.filter((r) =>
        r.participants?.some((p) => p.userId === userId)
      );
      // 최신순 정렬
      const sorted = [...myRooms].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return ok({ rooms: sorted });
    }
    return apiFetch(`/sessions/my`);
  },

  /**
   * 초대 코드로 방 참여
   *
   * [실제 API]
   *   GET /sessions/join/{roomUrl}  (세션 정보 조회)
   *   POST /sessions/{sessionId}/join  (세션에 입장)
   *   Response 200: { session }
   *   Response 404: { error: '초대 코드를 찾을 수 없습니다' }
   *   Response 410: { error: '이미 종료된 방입니다' }
   *
   * [동작]
   *   - # 접두어 유무에 관계없이 코드 정규화 후 검색
   *   - 이미 참여 중이면 에러 없이 방 정보만 반환 (멱등성)
   *   - DONE 방은 참여 불가
   */
  joinByCode: async (code, user) => {
    if (USE_MOCK) {
      await delay(400);
      // '#' 접두어 정규화 (있으면 유지, 없으면 추가)
      const normalized = code.trim().startsWith('#')
        ? code.trim().toUpperCase()
        : `#${code.trim().toUpperCase()}`;

      const room = _runtimeRooms.find((r) => r.code === normalized);
      if (!room) return err('초대 코드를 찾을 수 없습니다');
      if (room.status === 'DONE') return err('이미 종료된 방입니다');

      // 이미 participants에 있으면 방 정보만 반환 (재입장 허용)
      const alreadyIn = room.participants?.some((p) => p.userId === user.id);
      if (!alreadyIn) {
        if (!room.participants) room.participants = [];
        room.participants.push({
          userId:   user.id,
          username: user.username,
          role:     'MEMBER',
          joinedAt: new Date().toISOString(),
        });
      }
      return ok({ room });
    }
    return apiFetch(`/sessions/join/${code}`, {
      method: 'GET',
    });
  },

  /**
   * 킬내기 시작
   *
   * [실제 API]
   *   POST /sessions/:sessionId/start
   *   Response 200: { ok }
   *
   * [조건] 각 팀에 최소 1명 이상의 플레이어가 있어야 함
   */
  start: async (roomId) => {
    if (USE_MOCK) {
      await delay(300);
      const room = _runtimeRooms.find((r) => r.id === roomId);
      if (!room) return err('방을 찾을 수 없습니다');
      const emptyTeam = room.teams.find((t) => t.players.length === 0);
      if (emptyTeam) return err(`${emptyTeam.name}에 플레이어를 추가해주세요`);
      room.status = 'LIVE';
      return ok({ room });
    }
    return apiFetch(`/sessions/${roomId}/start`, { method: 'POST' });
  },
};
