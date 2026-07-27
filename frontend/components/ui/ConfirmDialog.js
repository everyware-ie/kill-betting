/**
 * ConfirmDialog
 * ──────────────
 * 파괴적이지 않은(되돌릴 수 있는) 액션을 확인받는 범용 모달.
 * "정말 삭제하시겠습니까?" 류의 가벼운 확인에 사용한다.
 */

'use client';

import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--kn-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
        padding: 20,
      }}
    >
      <div style={{
        background: 'var(--kn-surface-1)',
        border: '1px solid var(--kn-border)',
        borderRadius: 'var(--kn-r-xl)',
        width: '100%',
        maxWidth: 360,
        padding: 24,
        textAlign: 'center',
      }}>
        <Icon name="alert" size={28} color="var(--kn-danger)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', marginBottom: 6 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.6, marginBottom: 18 }}>
            {description}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: description ? 0 : 18 }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
