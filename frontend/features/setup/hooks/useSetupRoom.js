'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
import { MAX_PLAYERS_PER_TEAM } from '@/mock/rooms';
import { mapSessionRule, mapConfigTeams, mapConfigParticipants } from '../helpers/mappers';

export default function useSetupRoom() {
  const router = useRouter();
  const { id: roomId } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [inputs, setInputs] = useState({});

  const myTeam = room?.teams.find((t) => t.members?.some((m) => m.userId === user?.id));
  const hostUserId = room?.hostUserId;
  const isHost = hostUserId === user?.id;
  const isActionInProgress = useRef(false);

  // ── 방 정보 초기 로드 ──
  useEffect(() => {
    if (!user) return;

    RoomAPI.get(roomId).then(async (res) => {
      if (!res.success) { setError(res.error); setLoading(false); return; }

      const session = res.data;
      const configRes = await RoomAPI.getParticipants(session.id);
      const configState = configRes.success ? configRes.data : null;

      setRoom({
        ...session,
        rule: mapSessionRule(session),
        teams: configState ? mapConfigTeams(configState) : [],
        participants: configState ? mapConfigParticipants(configState, session.hostUserId) : [],
      });
      setLoading(false);
    });
  }, [roomId, user]);

  // ── WebSocket 실시간 동기화 ──
  useWebSocket(roomId, (configureState) => {
    if (!configureState || isActionInProgress.current) return;

    setRoom((prev) => ({
      ...prev,
      teams: prev.teams.map((team) => {
        const newTeamState = configureState.teams.find((t) => t.teamId === team.id);
        if (!newTeamState) return team;
        return {
          ...team,
          name: newTeamState.teamName,
          leaderUserId: newTeamState.leaderUserId,
          leaderNickname: newTeamState.leaderNickname,
        };
      }),
    }));
  }, !!user && !!room);

  // ── 팀 참여 / 이동 ──
  const handleMoveTeam = async (newTeamId) => {
    if (myTeam?.id === newTeamId) return;
    isActionInProgress.current = true;
    const res = await RoomAPI.joinTeam(roomId, newTeamId, user);
    if (res.success) setRoom((r) => ({ ...r, teams: res.data.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 대기석으로 이동 ──
  const handleLeaveTeam = async () => {
    if (!myTeam) return;
    isActionInProgress.current = true;
    const res = await RoomAPI.leaveTeam(roomId, myTeam.id, user.id);
    if (res.success) setRoom((r) => ({ ...r, teams: res.data.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 운영자 위임 ──
  const handleSetLeader = async (teamId, targetUserId) => {
    const res = await RoomAPI.setLeader(roomId, teamId, targetUserId);
    if (res.success) setRoom((r) => ({ ...r, teams: res.data.teams }));
    else setError(res.error);
  };

  // ── 닉네임 추가 ──
  const addPlayer = async (teamId) => {
    const nick = (inputs[teamId] || '').trim();
    if (!nick) return;
    if (/\s/.test(nick)) { setError('배그 닉네임에는 공백을 사용할 수 없습니다'); return; }
    const maxPerTeam = MAX_PLAYERS_PER_TEAM[room.rule.gameMode] || 4;
    const team = room.teams.find((t) => t.id === teamId);
    const allNicks = room.teams.flatMap((t) => t.players);
    if (allNicks.includes(nick)) { setError(`'${nick}'은 이미 다른 팀에 등록되어 있습니다`); return; }
    if (team.players.length >= maxPerTeam) { setError(`${team.name}은 최대 ${maxPerTeam}명까지 가능합니다`); return; }
    setError('');
    isActionInProgress.current = true;
    const updatedTeams = room.teams.map((t) =>
      t.id === teamId ? { ...t, players: [...t.players, nick] } : t
    );
    const res = await RoomAPI.updateTeams(roomId, updatedTeams);
    if (res.success) setRoom((r) => ({ ...r, teams: updatedTeams }));
    setInputs((p) => ({ ...p, [teamId]: '' }));
    isActionInProgress.current = false;
  };

  // ── 닉네임 삭제 ──
  const removePlayer = async (teamId, nick) => {
    isActionInProgress.current = true;
    const updatedTeams = room.teams.map((t) =>
      t.id === teamId ? { ...t, players: t.players.filter((p) => p !== nick) } : t
    );
    const res = await RoomAPI.updateTeams(roomId, updatedTeams);
    if (res.success) setRoom((r) => ({ ...r, teams: updatedTeams }));
    isActionInProgress.current = false;
  };

  // ── 팀 추가 ──
  const handleAddTeam = async () => {
    isActionInProgress.current = true;
    const res = await RoomAPI.addTeam(roomId);
    if (res.success) setRoom((r) => ({ ...r, teams: res.data.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 룰 저장 ──
  const handleSaveRule = async (newRule) => {
    const res = await RoomAPI.updateRule(roomId, newRule);
    if (res.success) setRoom((r) => ({ ...r, rule: newRule }));
    else setError(res.error);
    return res.success;
  };

  // ── 킬내기 시작 ──
  const handleStart = async () => {
    setError('');
    setStarting(true);
    const res = await RoomAPI.start(roomId);
    setStarting(false);
    if (!res.ok) { setError(res.error); return; }
    router.push(`/room/${roomId}/live`);
  };

  const totalPlayers = room?.teams.reduce((s, t) => s + t.players.length, 0) ?? 0;
  const canStart = (room?.teams.length ?? 0) >= 2 && totalPlayers >= 2;
  const maxPerTeam = MAX_PLAYERS_PER_TEAM[room?.rule?.gameMode] || 4;

  return {
    room, loading, error, starting, inputs, setInputs,
    user, myTeam, hostUserId, isHost,
    totalPlayers, canStart, maxPerTeam,
    handleMoveTeam, handleLeaveTeam, handleSetLeader,
    addPlayer, removePlayer, handleAddTeam,
    handleSaveRule, handleStart,
  };
}