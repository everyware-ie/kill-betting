import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const getStoredToken = () => {
  try { return sessionStorage.getItem('auth_token'); } catch { return null; }
};

/**
 * WebSocket 연결 + STOMP publish/subscribe 훅
 *
 * @param {string|number} sessionId - 세션 ID
 * @param {Function} onMessage - 구독 메시지 핸들러: (data) => void
 * @param {boolean} enabled - 연결 활성화 여부
 * @returns {{ publish, connected }}
 */
export function useWebSocket(sessionId, onMessage, enabled = true) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const token = getStoredToken();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      client.subscribe(
        `/topic/sessions/${sessionId}`,
        (message) => {
          try {
            const envelope = JSON.parse(message.body);
            onMessage?.(envelope);
          } catch (e) {
            console.error('WebSocket 메시지 파싱 실패:', e);
          }
        }
      );
    };

    client.onDisconnect = () => setConnected(false);
    client.onStompError = (frame) => console.error('STOMP 에러:', frame);

    client.activate();
    clientRef.current = client;

    return () => {
      setConnected(false);
      client.deactivate();
      clientRef.current = null;
    };
  }, [sessionId, enabled]);

  const publish = useCallback((destination, body = {}) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('WebSocket 미연결 상태에서 publish 시도:', destination);
      return;
    }
    client.publish({
      destination: `/app${destination}`,
      body: JSON.stringify(body),
    });
  }, []);

  return { publish, connected };
}
