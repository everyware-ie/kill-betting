'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
import { mapSessionRule } from '@/features/setup/helpers/mappers';
import { buildTeamScores, buildPlayerStats } from '../utils/resultCalc';

export default function useResultPage() {
  const router = useRouter();
  const { id: roomCode } = useParams();
  const { user } = useAuth();

  const [room,       setRoom]       = useState(null);
  const [scoreboard, setScoreboard] = useState(null);
  const [matches,    setMatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [renewing,     setRenewing]     = useState(false);
  const [renewError,   setRenewError]   = useState('');
  const [rematchModal, setRematchModal] = useState(null);
  const [nextSession,  setNextSession]  = useState(null);
  const [showDonation, setShowDonation] = useState(true);

  const isHost = !!(room && user && room.hostUserId === user.id);

  // ── 방/스코어보드/매치 로드 ──
  useEffect(() => {
    if (!user) return;
    RoomAPI.get(roomCode).then(async (roomRes) => {
      if (!roomRes.success) { setError(roomRes.error); setLoading(false); return; }
      const session = roomRes.data;
      setRoom({ ...session, rule: mapSessionRule(session) });

      const [scoreboardRes, matchRes] = await Promise.all([
        RoomAPI.getScoreboard(session.id),
        RoomAPI.getMatches(session.id),
      ]);
      if (scoreboardRes.success) setScoreboard(scoreboardRes.data);
      if (matchRes.success) setMatches(matchRes.data?.matches || []);
      setLoading(false);
    });
  }, [roomCode, user]);

  useEffect(() => { if (!user) router.push('/auth/login'); }, [user]);

  // ── WebSocket: 비호스트만 구독 (이어하기 알림 수신) ──
  const handleWsMessage = useCallback((envelope) => {
    if (envelope.type === 'SESSION_RENEWED' && envelope.data) {
      const { roomCode: nextRoomCode, name: nextName } = envelope.data;
      setRematchModal({ roomCode: nextRoomCode, name: nextName });
    }
  }, []);

  useWebSocket(room?.id, handleWsMessage, !!room?.id && !isHost);

  // ── 핸들러 ──
  const handleRenew = async () => {
    if (!room?.id) return;
    setRenewError('');
    setRenewing(true);
    const res = await RoomAPI.renew(room.id);
    setRenewing(false);
    if (!res.success) { setRenewError(res.error || '새 방 생성에 실패했습니다'); return; }
    setRematchModal({ roomCode: res.data.roomCode, name: res.data.name });
  };

  const handleRematchJoin = () => {
    if (rematchModal) router.push(`/room/${rematchModal.roomCode}/setup`);
  };

  const handleRematchLater = () => {
    if (rematchModal) setNextSession(rematchModal);
    setRematchModal(null);
  };

  // ── 파생값 ──
  const teamScores     = buildTeamScores(scoreboard);
  const allPlayerStats = buildPlayerStats(scoreboard, matches);
  const winner         = teamScores[0];
  const mvp            = allPlayerStats[0];
  const isOnWinningTeam = !!(winner && user && winner.leaderUserId === user.id);

  return {
    room, matches, loading, error,
    isHost, isOnWinningTeam, teamScores, allPlayerStats, mvp, winner,
    renewing, renewError, rematchModal, nextSession, showDonation,
    setShowDonation,
    handleRenew, handleRematchJoin, handleRematchLater,
  };
}
