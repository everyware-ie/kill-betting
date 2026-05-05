import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * WebSocket 연결 및 토픽 구독 훅
 *
 * @param {Long} sessionId - 세션 ID
 * @param {Function} onMessage - 메시지 수신 핸들러: (message) => void
 * @param {Boolean} enabled - 연결 활성화 여부 (기본값: true)
 *
 * @example
 * useWebSocket(roomId, (msg) => {
 *   setRoom(msg.body); // ConfigureStateMessage JSON 문자열
 * }, !!user);
 */
export function useWebSocket(sessionId, onMessage, enabled = true) {
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // STOMP 클라이언트 생성
    const client = new Client({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080'}/ws`,
      debug: (str) => {
        // 개발 중 WebSocket 디버깅 필요 시 console.log(str) 추가
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // STOMP 연결 성공 시 토픽 구독
    client.onConnect = () => {
      const subscription = client.subscribe(
        `/topic/sessions/${sessionId}/participants`,
        (message) => {
          if (onMessage) {
            try {
              const data = JSON.parse(message.body);
              onMessage(data);
            } catch (e) {
              console.error('WebSocket 메시지 파싱 실패:', e);
            }
          }
        }
      );
      subscriptionRef.current = subscription;
    };

    // 에러 처리
    client.onStompError = (frame) => {
      console.error('WebSocket STOMP 에러:', frame);
    };

    // 연결 시작
    client.activate();
    clientRef.current = client;

    // 클린업: 연결 종료
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [sessionId, onMessage, enabled]);
}
