'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoomAPI } from '@/lib/room-api';

export default function useDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [rooms,       setRooms]       = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [joinCode,    setJoinCode]    = useState('');
  const [joining,     setJoining]     = useState(false);
  const [joinError,   setJoinError]   = useState('');
  const joinInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    RoomAPI.list(user.id).then((res) => {
      if (res.success && res.data) setRooms(res.data);
      setRoomLoading(false);
    });
  }, [user]);

  const handleRoomClick = (room) => {
    const code = room.roomCode || room.code;
    if (room.status === 'WAITING') router.push(`/room/${code}/setup`);
    else if (room.status === 'IN_PROGRESS' || room.status === 'LIVE') router.push(`/room/${code}/live`);
    else router.push(`/room/${code}/result`);
  };

  const handleCodeChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (val && !val.startsWith('#')) val = `#${val}`;
    const body = val.slice(1).replace(/[^A-Z0-9]/g, '');
    val = body ? `#${body}` : '';
    if (val.length > 7) val = val.slice(0, 7);
    setJoinCode(val);
    setJoinError('');
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setJoinError('초대 코드를 입력해주세요');
      joinInputRef.current?.focus();
      return;
    }
    setJoining(true);
    setJoinError('');
    const res = await RoomAPI.joinByCode(joinCode, user);
    setJoining(false);
    if (!res.success) { setJoinError(res.message || '참여에 실패했습니다'); return; }
    const roomCode = res.data?.code || res.data?.roomCode;
    if (roomCode) router.push(`/room/${roomCode}/setup`);
  };

  return {
    user, authLoading, logout,
    rooms, roomLoading,
    joinCode, joining, joinError, joinInputRef,
    handleRoomClick, handleCodeChange, handleJoin,
  };
}
