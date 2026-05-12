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
import Button from '@/components/ui/Button';
import RoleGuideModal from '@/components/ui/RoleGuideModal';
import useSetupRoom from '@/features/setup/hooks/useSetupRoom';
import CopyCodeBadge from '@/features/setup/components/CopyCodeBadge';
import RuleEditModal from '@/features/setup/components/RuleEditModal';
import WaitingUserList from '@/features/setup/components/WaitingUserList';
import TeamCard from '@/features/setup/components/TeamCard';

export default function SetupPage() {
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  const {
    room, loading, error, starting, inputs, setInputs,
    user, hostUserId, isHost,
    totalPlayers, canStart,
    handleAddTeam, handleMoveToTeam,
    addPlayer, removePlayer,
    handleSetLeader, handleUnassignLeader,
    handleSaveRule, handleStart,
  } = useSetupRoom();

  const onSaveRule = async (newRule) => {
    const success = await handleSaveRule(newRule);
    if (success) setShowRuleModal(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8060' }}>불러오는 중...</div>;
  if (error && !room) return <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <Header room={room} isHost={isHost} onRuleEdit={() => setShowRuleModal(true)} onRoleGuide={() => setShowRoleGuide(true)} />

      {/* ── 룰 요약 배너 ── */}
      <RuleBanner rule={room?.rule} onEdit={() => setShowRuleModal(true)} />

      {/* ── 대기석 유저 목록 ── */}
      <WaitingUserList
        waitingUsers={room?.waitingUsers}
        teams={room?.teams}
        userId={user?.id}
        hostUserId={hostUserId}
        isHost={isHost}
        onMoveToTeam={handleMoveToTeam}
      />

      {/* ── 안내 ── */}
      <div style={{ background: 'rgba(200,155,0,0.03)', borderBottom: '1px solid rgba(200,155,0,0.07)', padding: '8px 24px', fontSize: 12, color: '#8A8060', flexShrink: 0 }}>
        배그 인게임 닉네임을 정확히 입력해주세요. OCR 매칭에 사용됩니다. &nbsp;|&nbsp; 총 <b style={{ color: '#F5A623' }}>{totalPlayers}</b>명 등록됨
      </div>

      {/* ── 팀 목록 ── */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 4, marginBottom: 14, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', fontSize: 12, color: '#E53935' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          {room?.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isHost={isHost}
              userId={user?.id}
              hostUserId={hostUserId}
              inputs={inputs}
              setInputs={setInputs}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onUnassignLeader={handleUnassignLeader}
            />
          ))}

          {/* 팀 추가 */}
          {(room?.teams.length || 0) < 6 && (
            <div onClick={handleAddTeam} style={{ background: '#1C1A0C', border: '1px dashed rgba(200,155,0,0.18)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer', color: '#555', fontSize: 13, gap: 8 }}>
              <span style={{ fontSize: 18 }}>+</span> 팀 추가
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 시작 버튼 ── */}
      <Footer
        canStart={canStart}
        starting={starting}
        teamCount={room?.teams.length ?? 0}
        totalPlayers={totalPlayers}
        onStart={handleStart}
      />

      {/* ── 모달 ── */}
      {showRuleModal && (
        <RuleEditModal rule={room.rule} onSave={onSaveRule} onClose={() => setShowRuleModal(false)} />
      )}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}

// ── 페이지 내부 섹션 컴포넌트 ──

function Header({ room, onRuleEdit, onRoleGuide }) {
  return (
    <div style={{ background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)', padding: '0 24px', height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>팀 구성</div>
          <div style={{ fontSize: 10, color: '#8A8060' }}>{room?.title}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CopyCodeBadge code={room?.code} />
        <button
          onClick={onRoleGuide}
          title="역할 안내"
          style={{ background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.22)', color: '#8A8060', width: 30, height: 30, borderRadius: 4, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}
        >?</button>
        <Button variant="ghost" onClick={onRuleEdit} style={{ fontSize: 12, padding: '7px 14px' }}>⚙ 룰 수정</Button>
      </div>
    </div>
  );
}

function RuleBanner({ rule, onEdit }) {
  const tags = [
    { label: rule?.gameMode },
    { label: `목표 ${rule?.targetKills}킬` },
    { label: rule?.noTimeLimit ? '시간제한 없음' : `${rule?.timeLimitMin}분` },
    ...(rule?.chickenBonusOn    ? [{ label: `치킨 +${rule.chickenBonus}`,        color: '#F5A623' }] : []),
    ...(rule?.survivalPenaltyOn ? [{ label: `생존 -${rule.survivalPenalty}`,     color: '#E53935' }] : []),
  ];

  return (
    <div style={{ background: '#1a1800', borderBottom: '1px solid rgba(200,155,0,0.1)', padding: '8px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: '#8A8060' }}>현재 룰:</span>
      {tags.map((tag, i) => (
        <span key={i} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.2)', color: tag.color || '#E8DFC0' }}>{tag.label}</span>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8A8060', cursor: 'pointer', textDecoration: 'underline' }} onClick={onEdit}>수정하기</span>
    </div>
  );
}

function Footer({ canStart, starting, teamCount, totalPlayers, onStart }) {
  let statusText;
  if (canStart) {
    statusText = `✓ 준비 완료 — ${teamCount}개 팀, 총 ${totalPlayers}명`;
  } else if (teamCount < 2) {
    statusText = '팀이 2개 이상 필요합니다';
  } else {
    statusText = `배그 닉네임을 팀 전체 합산 2명 이상 입력해주세요 (현재 ${totalPlayers}명)`;
  }

  return (
    <div style={{ background: '#1C1A0C', borderTop: '1px solid rgba(200,155,0,0.18)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: 12, color: '#8A8060' }}>{statusText}</div>
      <Button onClick={onStart} loading={starting} disabled={!canStart} size="lg" style={{ minWidth: 160 }}>
        킬내기 시작 ▶
      </Button>
    </div>
  );
}