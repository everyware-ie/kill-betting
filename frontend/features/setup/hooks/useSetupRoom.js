'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
import { mapSessionRule } from '../helpers/mappers';

const TEAM_NAMES = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'];

const generateRandomTeamName = () => {
  const name = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${name}-${suffix}`;
};

export default function useSetupRoom() {
  const router = useRouter();
  const { id: roomCode } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [inputs, setInputs] = useState({});

  const sessionId = room?.id;
  const hostUserId = room?.hostUserId;
  const isHost = hostUserId === user?.id;

  // ── 방 정보 초기 로드 ──
  useEffect(() => {
    if (!roomCode) return;

    RoomAPI.get(roomCode).then(async (res) => {
      if (!res.success) { setError(res.error); setLoading(false); return; }

      const session = res.data;
      const status = session.status;
      if (status === 'IN_PROGRESS' || status === 'LIVE') {
        router.replace(`/room/${roomCode}/live`);
        return;
      }
      if (status === 'ENDED' || status === 'DONE') {
        router.replace(`/room/${roomCode}/result`);
        return;
      }
      const teamsRes = await RoomAPI.getTeams(session.id);
      const teams = teamsRes.success ? teamsRes.data : [];

      setRoom({
        ...session,
        rule: mapSessionRule(session),
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          // 리더 판별에 필요 — 누락 시 WebSocket 갱신 전까지 리더에게 팀원 관리 UI가 보이지 않는다
          leaderUserId: t.leaderUserId,
          players: (t.players || []).map((nick, idx) => ({ id: idx, nickname: nick })),
          members: t.members || [],
        })),
        waitingUsers: [],
      });
      setLoading(false);
    });
  }, [roomCode]);

  // ── WebSocket 실시간 동기화 ──
  const { publish } = useWebSocket(sessionId, (envelope) => {
    if (!envelope) return;

    if (envelope.type === 'SESSION_STARTED') {
      router.push(`/room/${roomCode}/live`);
      return;
    }

    if (envelope.type === 'PARTICIPANT_UPDATED' && envelope.data) {
      const state = envelope.data;
      setRoom((prev) => ({
        ...prev,
        waitingUsers: state.waitingUsers || [],
        teams: state.teams
          ? state.teams.map((t) => ({
              id: t.teamId,
              name: t.teamName,
              status: t.status,
              leaderUserId: t.leaderUserId,
              leaderNickname: t.leaderNickname,
              players: (t.players || []).map((p) => ({ id: p.playerId, nickname: p.playerNickname })),
              members: t.members || [],
            }))
          : prev.teams,
      }));
    }
  }, !!room);

  // ── 팀 생성 ──
  const handleAddTeam = () => {
    publish(`/sessions/${sessionId}/teams/create`, { name: generateRandomTeamName() });
  };

  // ── 팀 삭제 ──
  const handleDeleteTeam = (teamId) => {
    publish(`/sessions/${sessionId}/teams/${teamId}/delete`);
  };

  // ── 대기석 유저를 팀 리더로 배정 (호스트) ──
  const handleMoveToTeam = (teamId, targetUserId) => {
    publish(`/sessions/${sessionId}/teams/${teamId}/leader`, { userId: targetUserId });
  };

  // ── 닉네임 추가 (직접 입력) ──
  const addPlayer = (teamId) => {
    const nick = (inputs[teamId] || '').trim();
    if (!nick) return;
    if (/\s/.test(nick)) { setError('배그 닉네임에는 공백을 사용할 수 없습니다'); return; }
    setError('');
    publish(`/sessions/${sessionId}/teams/${teamId}/players/add`, { playerNickname: nick });
    setInputs((p) => ({ ...p, [teamId]: '' }));
  };

  // ── 닉네임 삭제 ──
  const removePlayer = (teamId, playerId) => {
    publish(`/sessions/${sessionId}/teams/${teamId}/players/${playerId}/remove`);
  };

  // ── 리더 위임 ──
  const handleSetLeader = (teamId, targetUserId) => {
    publish(`/sessions/${sessionId}/teams/${teamId}/leader`, { userId: targetUserId });
  };

  // ── 리더 해제 ──
  const handleUnassignLeader = (teamId) => {
    publish(`/sessions/${sessionId}/teams/${teamId}/leader/remove`);
  };

  // ── 룰 저장 (REST 유지) ──
  const handleSaveRule = async (newRule) => {
    const res = await RoomAPI.updateRule(sessionId, newRule);
    if (res.success) setRoom((r) => ({ ...r, rule: newRule }));
    else setError(res.error);
    return res.success;
  };

  // ── 킬내기 시작 (REST 유지) ──
  const handleStart = async () => {
    setError('');
    setStarting(true);
    const res = await RoomAPI.start(sessionId);
    setStarting(false);
    if (!res.success) { setError(res.message || '시작에 실패했습니다'); return; }
    router.push(`/room/${roomCode}/live`);
  };

  const totalPlayers = room?.teams.reduce((s, t) => s + (t.players || []).length, 0) ?? 0;
  const allTeamsReady = (room?.teams ?? []).every(
    (t) => t.leaderUserId && (t.players || []).length > 0
  );
  const canStart = (room?.teams.length ?? 0) >= 2 && allTeamsReady;

  return {
    room, loading, error, starting, inputs, setInputs,
    user, hostUserId, isHost,
    totalPlayers, canStart,
    handleAddTeam, handleDeleteTeam, handleMoveToTeam,
    addPlayer, removePlayer,
    handleSetLeader, handleUnassignLeader,
    handleSaveRule, handleStart,
  };
}
