import Icon from '@/components/ui/Icon';
import { groupMatchesByTeam } from '../helpers/matchGrouping';

export default function TeamMatchHistory({ matches, teams, onMatchClick, myTeamId, onDeleteMatch }) {
  const groups = groupMatchesByTeam(matches, teams);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map((group) => (
        <TeamMatchSection
          key={group.teamId}
          group={group}
          onMatchClick={onMatchClick}
          myTeamId={myTeamId}
          onDeleteMatch={onDeleteMatch}
        />
      ))}
    </div>
  );
}

function TeamMatchSection({ group, onMatchClick, myTeamId, onDeleteMatch }) {
  const recentMatches = [...group.matches].reverse().slice(0, 30);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span data-label="">{group.teamName} 히스토리</span>
        {group.matches.length > 30 && (
          <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{group.matches.length}게임 중 최근 30개</span>
        )}
      </div>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
        {recentMatches.length === 0 ? (
          <div style={{ color: 'var(--kn-text-dim)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>아직 등록된 매치 없음</div>
        ) : (
          recentMatches.map((match) => (
            <TeamMatchRow
              key={match.matchId}
              match={match}
              onClick={onMatchClick}
              canDelete={!!myTeamId && match.teamId === myTeamId}
              onDelete={onDeleteMatch}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TeamMatchRow({ match, onClick, canDelete, onDelete }) {
  const results = match.memberResults || [];
  const totalKills = results.reduce((sum, r) => sum + r.kills, 0);
  const hasChicken = results.some((r) => r.isChicken);
  const hasShot = !!match.screenshotUrl;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`매치 #${match.matchNumber}을(를) 삭제할까요? 반영된 점수가 되돌려집니다.`)) {
      onDelete(match.matchId);
    }
  };

  return (
    <div
      onClick={() => hasShot && onClick({ url: match.screenshotUrl, match })}
      style={{ padding: '9px 0', borderBottom: '1px solid var(--kn-border)', cursor: hasShot ? 'pointer' : 'default', borderRadius: 'var(--kn-r-sm)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kn-accent)' }}>매치 #{match.matchNumber}</span>
          {hasChicken && <Icon name="trophy" size={10} color="var(--kn-accent)" />}
          {hasShot && <Icon name="image" size={10} color="var(--kn-text-muted)" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>
            {match.playedAt ? new Date(match.playedAt).toLocaleTimeString('ko') : ''}
          </span>
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              aria-label={`매치 #${match.matchNumber} 삭제`}
            >
              <Icon name="close" size={12} color="var(--kn-danger)" />
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>
        킬: <b style={{ color: 'var(--kn-text)' }}>{totalKills}</b>
        {results.map((r) => (
          <span key={r.playerId} style={{ marginLeft: 6 }}>{r.playerNickname} {r.kills}킬</span>
        ))}
      </div>
    </div>
  );
}