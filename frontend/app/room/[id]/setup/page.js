/**
 * ============================================================
 *  팀 구성 페이지  /room/:id/setup
 * ============================================================
 *
 *  [개념 정리]
 *
 *  팀 members (로그인 유저)
 *    - 방에 들어온 로그인 유저
 *    - 방 입장 시 빈 자리 있는 팀에 자동 배정
 *    - 다른 팀으로 이동 가능
 *    - role: LEADER(1명) | MEMBER(나머지)
 *
 *  팀 players (킬내기 참가자)
 *    - 배그 인게임 닉네임 문자열
 *    - 계정 연동 없음, 직접 입력
 *    - members와 별개 — members가 있어도 players는 따로 입력해야 함
 *
 *  LEADER 권한
 *    - OCR 스크린샷 업로드
 *    - 매치 결과 수치 수정
 *    - 팀당 1명만 가능
 *    - 다른 멤버에게 위임 가능
 *
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import RoleGuideModal from '@/components/ui/RoleGuideModal';
import useSetupRoom from '@/features/setup/hooks/useSetupRoom';
import CopyCodeBadge from '@/features/setup/components/CopyCodeBadge';
import RuleEditModal from '@/features/setup/components/RuleEditModal';
import WaitingUserList from '@/features/setup/components/WaitingUserList';
import TeamCard from '@/features/setup/components/TeamCard';
import useFavoriteNicknames from '@/features/favorite/hooks/useFavoriteNicknames';

export default function SetupPage() {
  const router = useRouter();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  const {
    room, loading, error, starting, inputs, setInputs,
    user, hostUserId, isHost,
    totalPlayers, canStart,
    handleAddTeam, handleDeleteTeam, handleMoveToTeam,
    addPlayer, addPlayerByNickname, removePlayer,
    handleSetLeader, handleUnassignLeader,
    handleSaveRule, handleStart,
  } = useSetupRoom();

  // 팀원 추가 시 타이핑 없이 고를 수 있는 닉네임 (즐겨찾기 + 최근 함께함)
  const { favorites, recentUnfavorited, addFavorite } = useFavoriteNicknames();

  const onSaveRule = async (newRule) => {
    const success = await handleSaveRule(newRule);
    if (success) setShowRuleModal(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-text-muted)' }}>
      <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
    </div>
  );
  if (error && !room) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-danger)' }}>
      <Icon name="alert" size={16} style={{ marginRight: 8 }} /> {error}
    </div>
  );

  const rule = room?.rule;
  const teams = room?.teams || [];

  // 같은 사람이 두 팀에 동시에 있을 수는 없으므로, 세션 안에서 이미 쓰인 닉네임은
  // 어느 팀의 선택 목록에서도 감춘다 (팀 단위가 아니라 세션 단위로 판단)
  const usedNicknames = teams.flatMap((t) => (t.players || []).map((p) => p.nickname));
  const teamCount = teams.length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <header style={{
        background: 'var(--kn-surface-1)',
        borderBottom: '1px solid var(--kn-border)',
        padding: '0 24px',
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Icon name="back" size={20} />
          </button>
          <div>
            <div data-label="" style={{ fontSize: 10, color: 'var(--kn-text-muted)' }}>ROOM SETUP</div>
            <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', letterSpacing: '-0.01em' }}>{room?.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CopyCodeBadge code={room?.code} />
          <button
            onClick={() => setShowRoleGuide(true)}
            title="설정"
            style={{
              background: 'var(--kn-surface-3)',
              border: '1px solid var(--kn-border)',
              color: 'var(--kn-text-muted)',
              width: 34, height: 34,
              borderRadius: 'var(--kn-r-md)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="settings" size={16} />
          </button>
        </div>
      </header>

      {/* ── 본문: 사이드바 + 메인 ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 좌측 사이드바 */}
        <aside style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--kn-border)',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          overflowY: 'auto',
        }}>

          {/* RULE 섹션 */}
          <div>
            <div data-label="" style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginBottom: 12, letterSpacing: 1.2 }}>게임 규칙</div>
            <div style={{
              background: 'var(--kn-surface-1)',
              border: '1px solid var(--kn-border)',
              borderRadius: 'var(--kn-r-lg)',
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <RuleRow icon="target" label="목표" value={`${rule?.targetKills ?? 20}킬 먼저`} />
              <RuleRow icon="flag" label="매치 수" value={`${rule?.matchCount ?? 3}매치`} />
              <RuleRow icon="clock" label="시간" value={rule?.noTimeLimit ? '제한 없음' : `${rule?.timeLimitMin}분`} />
              {rule?.chickenBonusOn && (
                <RuleRow icon="trophy" label="치킨" value={`+${rule.chickenBonus}`} valueColor="var(--kn-success)" />
              )}
              {rule?.survivalPenaltyOn && (
                <RuleRow icon="shield" label="생존" value={`-${rule.survivalPenalty}`} valueColor="var(--kn-danger)" />
              )}
              <button
                onClick={() => setShowRuleModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--kn-text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 0 0',
                  fontFamily: 'inherit',
                }}
              >
                <Icon name="edit" size={12} /> 룰 수정
              </button>
            </div>
          </div>

          {/* STATUS 섹션 */}
          <div>
            <div data-label="" style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginBottom: 12, letterSpacing: 1.2 }}>참여 현황</div>
            <div style={{
              background: 'var(--kn-surface-1)',
              border: '1px solid var(--kn-border)',
              borderRadius: 'var(--kn-r-lg)',
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <StatusRow label="팀 수" value={teamCount} />
              <StatusRow label="총 인원" value={totalPlayers} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>준비 상태</span>
                {canStart ? (
                  <span style={{ fontSize: 12, color: 'var(--kn-success)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Icon name="check" size={13} /> 완료
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--kn-text-dim)' }}>미완료</span>
                )}
              </div>
            </div>
          </div>

          {/* 대기석 섹션 */}
          <WaitingUserList
            waitingUsers={room?.waitingUsers}
            teams={teams}
            userId={user?.id}
            hostUserId={hostUserId}
            isHost={isHost}
            onMoveToTeam={handleMoveToTeam}
          />
        </aside>

        {/* 메인 영역 */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* TEAMS 헤더 */}
          <div style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--kn-border)',
            flexShrink: 0,
          }}>
            <span data-label="" style={{ fontSize: 12, color: 'var(--kn-text-muted)', letterSpacing: 1.2 }}>
              TEAMS <span style={{ color: 'var(--kn-text-dim)' }}>· {teamCount}</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {teamCount < 6 && (
                <button
                  onClick={handleAddTeam}
                  style={{
                    background: 'none',
                    border: '1px solid var(--kn-border)',
                    color: 'var(--kn-text-muted)',
                    padding: '5px 12px',
                    borderRadius: 'var(--kn-r-md)',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon name="plus" size={13} /> 팀 추가
                </button>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{ margin: '12px 24px 0', padding: '10px 14px', borderRadius: 'var(--kn-r-md)', background: 'color-mix(in oklab, var(--kn-danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)', fontSize: 12, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          {/* 팀 카드 그리드 */}
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {teams.map((team, idx) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  teamIndex={idx}
                  isHost={isHost}
                  userId={user?.id}
                  hostUserId={hostUserId}
                  inputs={inputs}
                  setInputs={setInputs}
                  onAddPlayer={addPlayer}
                  onRemovePlayer={removePlayer}
                  favorites={favorites}
                  recentUnfavorited={recentUnfavorited}
                  usedNicknames={usedNicknames}
                  onPickNickname={addPlayerByNickname}
                  onSaveFavorite={addFavorite}
                  onUnassignLeader={handleUnassignLeader}
                  onDeleteTeam={handleDeleteTeam}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── 하단 바 ── */}
      <footer style={{
        background: 'var(--kn-surface-1)',
        borderTop: '1px solid var(--kn-border)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 13 }}>
          {canStart ? (
            <>
              <span style={{ fontWeight: 'var(--kn-w-bold)' }}>모든 팀이 준비됐어요</span>
              <span style={{ color: 'var(--kn-text-muted)', marginLeft: 8, fontSize: 12 }}>시작하면 라이브 스코어보드로 이동합니다.</span>
            </>
          ) : (
            <ReadyStatus teams={teams} teamCount={teamCount} />
          )}
        </div>
        <Button
          variant="primary"
          onClick={handleStart}
          loading={starting}
          disabled={!canStart}
          size="lg"
          iconRight="play"
          style={{ minWidth: 140 }}
        >
          매치 시작
        </Button>
      </footer>

      {/* 모달 */}
      {showRuleModal && (
        <RuleEditModal rule={room.rule} onSave={onSaveRule} onClose={() => setShowRuleModal(false)} />
      )}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}


// ── 사이드바 내부 컴포넌트 ──

function RuleRow({ icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--kn-text-muted)', fontSize: 12 }}>
        <Icon name={icon} size={13} />
        {label}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: valueColor || 'var(--kn-text)' }}>{value}</span>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>{label}</span>
      <span data-mono="" style={{ fontSize: 13, fontWeight: 600, color: 'var(--kn-text)' }}>{value}</span>
    </div>
  );
}

function ReadyStatus({ teams, teamCount }) {
  if (teamCount < 2) {
    return <span style={{ color: 'var(--kn-text-muted)', fontSize: 12 }}>팀이 2개 이상 필요합니다</span>;
  }
  const noLeader = teams.filter((t) => !t.leaderUserId).map((t) => t.name);
  const noPlayer = teams.filter((t) => (t.players || []).length === 0).map((t) => t.name);
  const issues = [];
  if (noLeader.length > 0) issues.push(`리더 미배정: ${noLeader.join(', ')}`);
  if (noPlayer.length > 0) issues.push(`닉네임 미등록: ${noPlayer.join(', ')}`);
  const msg = issues.length > 0 ? issues.join(' | ') : '모든 팀의 준비를 완료해주세요';
  return <span style={{ color: 'var(--kn-text-muted)', fontSize: 12 }}>{msg}</span>;
}
