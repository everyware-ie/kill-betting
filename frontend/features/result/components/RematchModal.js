import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function RematchModal({ nextSessionName, onJoin, onLater }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border-strong)', borderRadius: 'var(--kn-r-xl)', padding: '28px 28px 24px', maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'color-mix(in oklab, var(--kn-accent) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-accent) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="zap" size={20} color="var(--kn-accent)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'var(--kn-w-bold)' }}>다음 킬내기가 생성되었습니다</div>
            <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginTop: 2 }}>참여하시겠습니까?</div>
          </div>
        </div>
        {nextSessionName && (
          <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-md)', padding: '10px 14px', fontSize: 13, color: 'var(--kn-text)' }}>
            {nextSessionName}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onLater}>다음에 참여하기</Button>
          <Button variant="primary" style={{ flex: 1 }} icon="arrow" onClick={onJoin}>바로 참여</Button>
        </div>
      </div>
    </div>
  );
}
