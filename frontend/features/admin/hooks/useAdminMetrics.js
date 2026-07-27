import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/admin-api';

/**
 * 운영 지표를 조회한다.
 * status: 'loading' | 'ready' | 'forbidden' | 'error'
 */
export function useAdminMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await AdminAPI.getMetrics();
        if (!active) return;

        if (res.success) {
          setMetrics(res.data);
          setStatus('ready');
        } else if (res.forbidden) {
          setStatus('forbidden');
        } else {
          setStatus('error');
        }
      } catch {
        if (active) setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { metrics, status };
}
