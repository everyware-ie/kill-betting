'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RoomAPI } from '@/lib/room-api';
import Icon from '@/components/ui/Icon';

export default function RoomRedirectPage() {
  const router = useRouter();
  const { id: roomCode } = useParams();

  useEffect(() => {
    if (!roomCode) return;

    RoomAPI.get(roomCode).then((res) => {
      if (!res.success) {
        router.replace('/');
        return;
      }

      const status = res.data?.status;
      if (status === 'LIVE') {
        router.replace(`/room/${roomCode}/live`);
      } else if (status === 'DONE') {
        router.replace(`/room/${roomCode}/result`);
      } else {
        router.replace(`/room/${roomCode}/setup`);
      }
    }).catch(() => {
      router.replace('/');
    });
  }, [roomCode, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--kn-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--kn-text-muted)',
    }}>
      <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
    </div>
  );
}
