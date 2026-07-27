'use client';

import Icon from '@/components/ui/Icon';

/**
 * 팀 구성 화면에서 닉네임을 타이핑 없이 고르는 UI.
 *
 * - 즐겨찾기: 사용자가 직접 저장해둔 닉네임
 * - 최근 함께한 닉네임: 내가 리더였던 최근 세션에서 등록했던 닉네임 중
 *   아직 즐겨찾기에 없는 것(파생 데이터). 여기서 바로 즐겨찾기로 등록할 수 있다.
 *
 * 이미 이 팀에 등록된 닉네임은 눌러도 중복으로 거부되므로 미리 숨긴다.
 */
export default function NicknamePicker({
  favorites = [],
  recentUnfavorited = [],
  usedNicknames = [],
  onPick,
  onSaveFavorite,
}) {
  const used = new Set(usedNicknames);
  const pickableFavorites = favorites.filter((f) => !used.has(f.nickname));
  const pickableRecent = recentUnfavorited.filter((nick) => !used.has(nick));

  if (pickableFavorites.length === 0 && pickableRecent.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {pickableFavorites.length > 0 && (
        <Row label="즐겨찾기" icon="star">
          {pickableFavorites.map((favorite) => (
            <Chip key={favorite.id} onClick={() => onPick(favorite.nickname)}>
              {favorite.nickname}
            </Chip>
          ))}
        </Row>
      )}

      {pickableRecent.length > 0 && (
        <Row label="최근 함께함" icon="clock">
          {pickableRecent.map((nickname) => (
            <Chip
              key={nickname}
              onClick={() => onPick(nickname)}
              trailing={
                onSaveFavorite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSaveFavorite(nickname); }}
                    title="즐겨찾기에 추가"
                    style={{
                      background: 'none', border: 'none', padding: 0, marginLeft: 2,
                      color: 'var(--kn-accent)', cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <Icon name="plus" size={11} />
                  </button>
                )
              }
            >
              {nickname}
            </Chip>
          ))}
        </Row>
      )}
    </div>
  );
}

function Row({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 10, color: 'var(--kn-text-dim)',
        whiteSpace: 'nowrap', paddingTop: 4,
      }}>
        <Icon name={icon} size={10} /> {label}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{children}</div>
    </div>
  );
}

function Chip({ children, onClick, trailing }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        background: 'var(--kn-surface-2)',
        border: '1px dashed var(--kn-border-strong)',
        borderRadius: 'var(--kn-r-md)',
        padding: '2px 8px',
        fontSize: 11,
        color: 'var(--kn-text-muted)',
        cursor: 'pointer',
      }}
    >
      {children}
      {trailing}
    </span>
  );
}
