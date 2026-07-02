import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function ScreenshotModal({ info, onClose }) {
  const { url, match, team } = info;
  const totalKills = (match.results || []).reduce((s, r) => s + r.kills, 0);
  const hasChicken = match.chickenTeamId === match.teamId;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(6px)' }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--kn-accent)' }}>
              {team?.name ?? '?'} — {match.teamMatchNumber}번째 게임
            </span>
            {hasChicken && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="trophy" size={14} color="var(--kn-accent)" /> 치킨</span>}
            <span style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>킬 {totalKills}</span>
          </div>
          <Button variant="secondary" onClick={onClose} icon="close">닫기</Button>
        </div>
        <img
          src={url}
          alt={`${team?.name} 결과`}
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--kn-r-lg)', border: '1px solid var(--kn-border)' }}
        />
      </div>
    </div>
  );
}
