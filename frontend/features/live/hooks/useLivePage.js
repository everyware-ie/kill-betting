'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
import { mapSessionRule } from '@/features/setup/helpers/mappers';
import { calcTeamScore } from '../utils/scoreCalc';

export default function useLivePage() {
  const router = useRouter();
  const { id: roomCode } = useParams();
  const { user } = useAuth();

  const [sessionId, setSessionId] = useState(null);
  const [room, setRoom] = useState(null);
  const [matches, setMatches] = useState([]);
  const [adjs, setAdjs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // 모달 UI 상태
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [modalMatchNum, setModalMatchNum] = useState(1);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [screenshotModal, setScreenshotModal] = useState(null);

  // ── 방 정보 + 팀 + 매치 초기 로드 ──
  useEffect(() => {
    if (!roomCode) return;
    RoomAPI.get(roomCode).then(async (roomRes) => {
      if (!roomRes.success) { setLoading(false); return; }
      const session = roomRes.data;
      setSessionId(session.id);
      const teamsRes = await RoomAPI.getTeams(session.id);
      const teams = teamsRes.success ? teamsRes.data.map((t) => ({
        id: t.id, name: t.name, leaderUserId: t.leaderUserId,
        players: (t.players || []).map((nick, idx) => ({ id: idx, nickname: nick })),
      })) : [];
      setRoom({ ...session, rule: mapSessionRule(session), teams });
      setAdjs([]);
      if (session.startedAt) {
        const initialElapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        setElapsed(Math.max(0, initialElapsed));
      }
      const matchRes = await RoomAPI.getMatches(session.id);
      if (matchRes.success) setMatches(matchRes.data?.matches || []);
      setLoading(false);
    });
  }, [roomCode]);

  // ── 경과 시간 타이머 ──
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── WebSocket 실시간 동기화 ──
  const { connected } = useWebSocket(sessionId, (envelope) => {
    if (!envelope) return;
    if (envelope.type === 'SCORE_UPDATED' && sessionId) {
      RoomAPI.getMatches(sessionId).then((matchRes) => {
        if (matchRes.success) setMatches(matchRes.data?.matches || []);
      });
    }
    if (envelope.type === 'ADJUSTMENT_APPLIED' && envelope.data) {
      setAdjs((prev) => [...prev, { teamId: envelope.data.teamId, amount: envelope.data.amount, reason: envelope.data.reason }]);
    }
    if (envelope.type === 'SESSION_ENDED') {
      router.push(`/room/${roomCode}/result`);
    }
  }, !!sessionId);

  // ── 핸들러 ──
  const openTeamModal = useCallback((teamId) => {
    const teamMatchCount = matches.filter((m) => (m.memberResults || []).some((r) => r.teamId === teamId)).length;
    setSelectedTeamId(teamId);
    setModalMatchNum(teamMatchCount + 1);
    setShowTeamModal(true);
    setMatchError('');
  }, [matches]);

  const handleMatchConfirmed = () => { setShowTeamModal(false); setMatchError(''); };

  const handleAdjust = async (teamId, amount, reason) => {
    await RoomAPI.addAdjustment(sessionId, teamId, amount, reason);
  };

  const handleRuleUpdate = async (newRule) => {
    const res = await RoomAPI.updateRule(sessionId, newRule);
    if (res.success) setRoom((prev) => ({ ...prev, rule: res.data.rule || newRule }));
  };

  const handleEnd = async () => {
    const res = await RoomAPI.end(sessionId);
    if (res.success) router.push(`/room/${roomCode}/result`);
  };

  // ── 파생 값 ──
  const myTeam = room?.teams?.find((t) => t.leaderUserId === user?.id);
  const isHost = room?.hostUserId === user?.id;
  const teamScores = (room?.teams ?? []).map((t) => ({
    ...t,
    ...calcTeamScore(t.id, matches, room?.rule ?? {}, adjs),
  }));
  const timeLimit = room?.rule?.noTimeLimit ? null : (room?.rule?.timeLimitMin ?? 0) * 60;
  const timeLeft = timeLimit ? Math.max(0, timeLimit - elapsed) : null;
  const targetReachedTeam = teamScores.find((t) => t.total >= (room?.rule?.targetKills ?? Infinity));
  const timeOver = timeLeft !== null && timeLeft === 0;
  const gameOver = !!targetReachedTeam || timeOver;

  return {
    // 데이터
    room, matches, adjs, elapsed, loading, sessionId, connected,
    // 파생값
    isHost, myTeam, teamScores, timeLeft, gameOver, targetReachedTeam,
    // 모달 상태
    showTeamModal, selectedTeamId, modalMatchNum,
    showAdminModal, showRoleGuide, matchError, screenshotModal,
    // 모달 상태 setter
    setShowTeamModal, setShowAdminModal, setShowRoleGuide, setScreenshotModal,
    // 핸들러
    openTeamModal, handleMatchConfirmed, handleAdjust, handleRuleUpdate, handleEnd,
  };
}
