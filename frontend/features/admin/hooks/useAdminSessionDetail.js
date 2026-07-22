import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/admin-api';

/**
 * 어드민 세션 상세를 조회한다.
 * state: 'loading' | 'ready' | 'forbidden' | 'notFound' | 'error'
 */
export function useAdminSessionDetail(sessionId) {
  const [detail, setDetail] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    setState('loading');

    (async () => {
      const res = await AdminAPI.getSessionDetail(sessionId);
      if (!active) return;

      if (res.success) {
        setDetail(res.data);
        setState('ready');
      } else if (res.forbidden) {
        setState('forbidden');
      } else if (res.notFound) {
        setState('notFound');
      } else {
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId]);

  return { detail, state };
}