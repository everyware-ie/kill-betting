import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/admin-api';

/**
 * 어드민 세션 목록을 조회한다. status/page 변경 시 재조회.
 * state: 'loading' | 'ready' | 'forbidden' | 'error'
 */
export function useAdminSessions({ status = null, page = 0 } = {}) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let active = true;
    setState('loading');

    (async () => {
      const res = await AdminAPI.getSessions({ status, page });
      if (!active) return;

      if (res.success) {
        setData(res.data);
        setState('ready');
      } else if (res.forbidden) {
        setState('forbidden');
      } else {
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [status, page]);

  return { data, state };
}