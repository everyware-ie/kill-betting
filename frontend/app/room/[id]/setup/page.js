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

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }   from '@/lib/auth-context';
import { RoomAPI }   from '@/lib/room-api';
import { MAX_PLAYERS_PER_TEAM } from '@/mock/rooms';
import Button from '@/components/ui/Button';
import RoleGuideModal from '@/components/ui/RoleGuideModal';

const normalizeId = (value) => (value == null ? '' : String(value));
const sameId = (a, b) => normalizeId(a) === normalizeId(b);

// ── 클립보드 복사 헬퍼 ──
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('input');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

// ── 초대 코드 + URL 공유 배지 ──
// code  : 초대 코드 문자열 (예: "0e0071b1-85d1-48a...")
// 공유 URL : window.location.origin + '/join/' + code
function CopyCodeBadge({ code }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [urlCopied,  setUrlCopied]  = useState(false);

  const shareUrl = code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${code}` : null;

  const handleCopyCode = async () => {
    if (!code) return;
    const ok = await copyToClipboard(code);
    if (ok) { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    const ok = await copyToClipboard(shareUrl);
    if (ok) { setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>

      {/* 초대 코드 복사 버튼 */}
      <button
        onClick={handleCopyCode}
        title="초대 코드 복사"
        style={{
          background: '#141200',
          border: `1px solid ${codeCopied ? 'rgba(76,175,80,0.5)' : 'rgba(200,155,0,0.25)'}`,
          borderRadius: 4, padding: '4px 12px',
          textAlign: 'center', cursor: 'pointer',
          transition: 'border-color .2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}
      >
        <div style={{ fontSize: 9, color: codeCopied ? '#4CAF50' : '#8A8060', letterSpacing: 1.5 }}>
          {codeCopied ? '✓ 복사됨' : '초대 코드  📋'}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          fontFamily: "'Share Tech Mono', monospace",
          color: codeCopied ? '#4CAF50' : '#F5A623',
          letterSpacing: 2,
          maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {code ?? '—'}
        </div>
      </button>

      {/* URL 공유 버튼 */}
      <button
        onClick={handleCopyUrl}
        title="입장 링크 복사 — 클릭 한 번에 바로 입장"
        style={{
          background: urlCopied ? 'rgba(76,175,80,0.1)' : 'rgba(200,155,0,0.07)',
          border: `1px solid ${urlCopied ? 'rgba(76,175,80,0.45)' : 'rgba(200,155,0,0.25)'}`,
          borderRadius: 4, padding: '4px 12px',
          cursor: 'pointer', transition: 'all .2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}
      >
        <div style={{ fontSize: 9, color: urlCopied ? '#4CAF50' : '#8A8060', letterSpacing: 1.5 }}>
          {urlCopied ? '✓ 복사됨' : '입장 링크  🔗'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: urlCopied ? '#4CAF50' : '#C8B878' }}>
          URL 복사
        </div>
      </button>

    </div>
  );
}

// ── 토글 ──
const Toggle = ({ on, onChange }) => (
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: on ? '#F5A623' : '#2a2810', border: '1px solid rgba(200,155,0,0.25)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 2, left: on ? 19 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
  </div>
);

// ── 스테퍼 ──
const Stepper = ({ value, onChange, min = 0, max = 99, disabled }) => (
  <div style={{ display: 'flex' }}>
    <button disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 28, height: 30, background: '#141200', border: '1px solid rgba(200,155,0,0.25)', borderRadius: '4px 0 0 4px', color: '#F5A623', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}>−</button>
    <input type="number" value={value} disabled={disabled} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= min && v <= max) onChange(v); }} style={{ width: 48, height: 30, textAlign: 'center', background: '#141200', border: '1px solid rgba(200,155,0,0.3)', borderLeft: 'none', borderRight: 'none', color: '#F5A623', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }} />
    <button disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 28, height: 30, background: '#141200', border: '1px solid rgba(200,155,0,0.25)', borderRadius: '0 4px 4px 0', color: '#F5A623', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}>+</button>
  </div>
);

// ════════════════════════════════════════
//  룰 수정 모달
// ════════════════════════════════════════
function RuleEditModal({ rule, onSave, onClose }) {
  const [local, setLocal] = useState({ ...rule });
  const set = (k, v) => setLocal((r) => ({ ...r, [k]: v }));

  const RULES = [
    { label: '헤드샷 보너스',  onKey: 'headShotBonusOn',    valKey: 'headShotBonus',   sign: '+', color: '#F5A623' },
    { label: '어시스트 보너스', onKey: 'assistBonusOn',      valKey: 'assistBonus',     sign: '+', color: '#F5A623' },
    { label: '치킨 보너스',    onKey: 'chickenBonusOn',      valKey: 'chickenBonus',    sign: '+', color: '#F5A623' },
    { label: '팀킬 패널티',    onKey: 'teamKillPenaltyOn',   valKey: 'teamKillPenalty', sign: '-', color: '#E53935' },
    { label: '사망 패널티',    onKey: 'deathPenaltyOn',      valKey: 'deathPenalty',    sign: '-', color: '#E53935' },
  ];

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.28)', borderRadius: 10, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(200,155,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>룰 수정</div>
            <div style={{ fontSize: 11, color: '#8A8060', marginTop: 3 }}>저장 버튼을 눌러야 실제로 반영됩니다</div>
          </div>
          <button onClick={onClose} style={{ background: '#2a2810', border: '1px solid rgba(200,155,0,0.2)', color: '#E8DFC0', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {/* 게임 모드 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>게임 모드</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[{ mode: '솔로', icon: '👤' }, { mode: '듀오', icon: '👥' }, { mode: '스쿼드', icon: '👨‍👩‍👧‍👦' }].map(({ mode, icon }) => (
                <div key={mode} onClick={() => set('gameMode', mode)} style={{ padding: '12px 8px', textAlign: 'center', background: local.gameMode === mode ? 'rgba(245,166,35,0.12)' : '#141200', border: `1px solid ${local.gameMode === mode ? '#F5A623' : 'rgba(200,155,0,0.18)'}`, borderRadius: 6, cursor: 'pointer' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{mode}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 기본 설정 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>기본 설정</div>
            <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid rgba(200,155,0,0.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>목표 킬 수</div>
                <Stepper value={local.targetKills} onChange={(v) => set('targetKills', v)} min={1} max={99} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>제한 시간 <span style={{ fontSize: 11, color: '#8A8060' }}>{local.noTimeLimit ? '(없음)' : `(${local.timeLimitMin}분)`}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Toggle on={local.noTimeLimit} onChange={() => set('noTimeLimit', !local.noTimeLimit)} />
                    <span style={{ fontSize: 11, color: '#8A8060' }}>제한 없음</span>
                  </div>
                  {!local.noTimeLimit && <Stepper value={local.timeLimitMin} onChange={(v) => set('timeLimitMin', v)} min={10} max={300} />}
                </div>
              </div>
            </div>
          </div>
          {/* 보너스/패널티 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#F5A623', marginBottom: 10 }}>보너스 / 패널티</div>
            <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              {RULES.map((item, idx) => (
                <div key={item.onKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < RULES.length - 1 ? '1px solid rgba(200,155,0,0.06)' : 'none', opacity: local[item.onKey] ? 1 : 0.45 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Toggle on={local[item.onKey]} onChange={() => set(item.onKey, !local[item.onKey])} />
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: item.color, fontSize: 14, fontWeight: 700, width: 12, textAlign: 'center' }}>{item.sign}</span>
                    <Stepper value={local[item.valKey]} onChange={(v) => set(item.valKey, v)} disabled={!local[item.onKey]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={() => onSave(local)}>💾 저장하기</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  팀 구성 메인 페이지
// ════════════════════════════════════════
export default function SetupPage() {
  const router = useRouter();
  const { id: roomId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [room,     setRoom]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [starting, setStarting] = useState(false);
  const [inputs,   setInputs]   = useState({});
  const [showRuleModal,  setShowRuleModal]  = useState(false);
  const [showRoleGuide,  setShowRoleGuide]  = useState(false);
  // 방장이 대기석 유저를 팀에 배정할 때 열리는 드롭다운 (userId | null)
  const [assignDropdown, setAssignDropdown] = useState(null);
  // 방장이 팀 내 멤버를 이동/대기석으로 보낼 때 열리는 드롭다운 ("teamId-userId" | null)
  const [memberDropdown, setMemberDropdown] = useState(null);

  // 현재 내가 속한 팀
  const myTeam = room?.teams.find((t) => t.members?.some((m) => sameId(m.userId, user?.id)));
  // 방장(HOST) userId — 팀 카드에서 방장 배지 표시에 사용
  const hostUserId = room?.participants?.find((p) => p.role === 'HOST')?.userId;
  // 내가 방장인지 여부
  const isHost = sameId(hostUserId, user?.id);

  // ── 로그인 체크 ──
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!assignDropdown && !memberDropdown) return;
    const handler = () => { setAssignDropdown(null); setMemberDropdown(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [assignDropdown, memberDropdown]);

  // ── 방 정보 폴링 ──
  // TODO: 백엔드 WebSocket 연동 시 이 useEffect를 제거하고
  //       stompClient.subscribe('/topic/room/{id}', handler) 로 교체
  const isActionInProgress = useRef(false); // 내가 직접 액션 중일 때 폴링 덮어쓰기 방지

  useEffect(() => {
    if (!user) return;

    // 최초 로드
    RoomAPI.get(roomId).then((res) => {
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      setRoom(res.room);
      setLoading(false);
    });

    // 5초마다 폴링 — 다른 유저의 팀 이동·닉네임 추가 등을 반영
    const id = setInterval(async () => {
      if (isActionInProgress.current) return; // 내 액션 처리 중엔 건너뜀
      const res = await RoomAPI.get(roomId);
      if (res.ok) setRoom(res.room);
      // 폴링 실패는 무시 (네트워크 일시 오류 허용)
    }, 5000);

    return () => clearInterval(id);
  }, [roomId, user]);

  // ── 팀 참여 / 이동 ──
  // 대기석에서 처음 참여하거나, 이미 팀에 있을 때 다른 팀으로 이동
  const handleMoveTeam = async (newTeamId) => {
    if (myTeam?.id === newTeamId) return;
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.joinTeam(roomId, newTeamId, user);
    if (res.ok) setRoom((r) => ({ ...r, teams: res.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 대기석으로 이동 (팀 탈퇴) ──
  const handleLeaveTeam = async () => {
    if (!myTeam) return;
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.leaveTeam(roomId, myTeam.id, user.id);
    if (res.ok) setRoom((r) => ({ ...r, teams: res.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 운영자 위임 ──
  const handleSetLeader = async (teamId, targetUserId) => {
    setError('');
    const res = await RoomAPI.setLeader(roomId, teamId, targetUserId);
    if (res.ok) setRoom((r) => ({ ...r, teams: res.teams }));
    else setError(res.error);
  };

  // ── 닉네임 추가 ──
  const addPlayer = async (teamId) => {
    const nick = (inputs[teamId] || '').trim();
    if (!nick) return;
    // 배그 닉네임 정책: 공백 불가
    if (/\s/.test(nick)) { setError('배그 닉네임에는 공백을 사용할 수 없습니다'); return; }
    const maxPerTeam = MAX_PLAYERS_PER_TEAM[room.rule.gameMode] || 4;
    const team = room.teams.find((t) => t.id === teamId);
    const allNicks = room.teams.flatMap((t) => t.players);
    if (allNicks.includes(nick)) { setError(`'${nick}'은 이미 다른 팀에 등록되어 있습니다`); return; }
    if (team.players.length >= maxPerTeam) { setError(`${team.name}은 최대 ${maxPerTeam}명까지 가능합니다`); return; }
    setError('');
    isActionInProgress.current = true;
    const updatedTeams = room.teams.map((t) =>
      t.id === teamId ? { ...t, players: [...t.players, nick] } : t
    );
    const res = await RoomAPI.updateTeams(roomId, updatedTeams);
    if (res.ok) {
      setRoom((r) => ({ ...r, teams: updatedTeams }));
      setInputs((p) => ({ ...p, [teamId]: '' }));  // 성공 시에만 입력값 초기화
    } else {
      setError(res.error || '닉네임 추가에 실패했습니다');
    }
    isActionInProgress.current = false;
  };

  // ── 닉네임 삭제 ──
  const removePlayer = async (teamId, nick) => {
    isActionInProgress.current = true;
    const updatedTeams = room.teams.map((t) =>
      t.id === teamId ? { ...t, players: t.players.filter((p) => p !== nick) } : t
    );
    const res = await RoomAPI.updateTeams(roomId, updatedTeams);
    if (res.ok) setRoom((r) => ({ ...r, teams: updatedTeams }));
    isActionInProgress.current = false;
  };

  // ── 팀 추가 ──
  const handleAddTeam = async () => {
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.addTeam(roomId);
    if (res.ok) setRoom((r) => ({ ...r, teams: res.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 팀 삭제 (방장 전용, 멤버·플레이어 없는 팀만 가능) ──
  const handleRemoveTeam = async (teamId) => {
    const team = room.teams.find((t) => t.id === teamId);
    if (!team) return;
    if ((team.members || []).length > 0) { setError('팀에 참여한 유저가 있어 삭제할 수 없습니다'); return; }
    if (team.players.length > 0)         { setError('등록된 배그 닉네임이 있어 삭제할 수 없습니다'); return; }
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.removeTeam(roomId, teamId);
    if (res.ok) setRoom((r) => ({ ...r, teams: res.teams }));
    else setError(res.error);
    isActionInProgress.current = false;
  };

  // ── 대기석 유저 → 팀 LEADER 배정 (방장 전용) ──
  // targetUserId  : 배정할 대기석 유저의 ID
  // targetUsername: 해당 유저의 닉네임 (화면 표시용)
  // teamId        : 배정할 팀 ID
  const handleAssignToTeam = async (targetUserId, targetUsername, teamId) => {
    setAssignDropdown(null);
    setError('');
    isActionInProgress.current = true;

    // PUT /api/sessions/{roomId}/teams/{teamId}/operator  { userId }
    // → setLeader가 configure 재조회 후 최신 teams 반환
    const res = await RoomAPI.setLeader(roomId, teamId, targetUserId);
    if (res.ok && res.teams) {
      setRoom((r) => ({ ...r, teams: res.teams }));
    } else if (!res.ok) {
      setError(res.error || `${targetUsername}님을 팀에 배정하는 데 실패했습니다`);
    }
    isActionInProgress.current = false;
  };

  // ── 팀 멤버 → 대기석으로 이동 (방장 전용) ──
  const handleMoveToWaiting = async (fromTeamId, targetUserId, targetUsername) => {
    setMemberDropdown(null);
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.leaveTeam(roomId, fromTeamId, targetUserId);
    if (res.ok) {
      const refreshed = await RoomAPI.get(roomId);
      if (refreshed.ok) setRoom(refreshed.room);
    } else {
      setError(res.error || `${targetUsername}님을 대기석으로 이동하는 데 실패했습니다`);
    }
    isActionInProgress.current = false;
  };

  // ── 팀 멤버 → 다른 팀 LEADER로 이동 (방장 전용) ──
  const handleMoveMemberToTeam = async (targetUserId, targetUsername, newTeamId) => {
    setMemberDropdown(null);
    setError('');
    isActionInProgress.current = true;
    const res = await RoomAPI.setLeader(roomId, newTeamId, targetUserId);
    if (res.ok && res.teams) {
      setRoom((r) => ({ ...r, teams: res.teams }));
    } else if (!res.ok) {
      setError(res.error || `${targetUsername}님을 이동하는 데 실패했습니다`);
    }
    isActionInProgress.current = false;
  };

  // ── 룰 저장 ──
  const handleSaveRule = async (newRule) => {
    const res = await RoomAPI.updateRule(roomId, newRule);
    if (res.ok) { setRoom((r) => ({ ...r, rule: newRule })); setShowRuleModal(false); }
    else setError(res.error);
  };

  // ── 킬내기 시작 ──
  const handleStart = async () => {
    setError('');
    setStarting(true);
    const res = await RoomAPI.start(roomId);
    setStarting(false);
    if (!res.ok) { setError(res.error); return; }
    router.push(`/room/${roomId}/live`);
  };

  const totalPlayers = room?.teams.reduce((s, t) => s + t.players.length, 0) ?? 0;
  // 시작 조건: 팀이 2개 이상 + 전체 닉네임 합계 2명 이상
  const canStart = (room?.teams.length ?? 0) >= 2 && totalPlayers >= 2;
  const maxPerTeam = MAX_PLAYERS_PER_TEAM[room?.rule?.gameMode] || 4;
  const allTeamUserIds = new Set(
    room?.teams.flatMap((t) => (t.members || []).map((m) => normalizeId(m.userId))) || []
  );
  const waitingUsers = (room?.participants || []).filter(
    (p) => !allTeamUserIds.has(normalizeId(p.userId))
  );
  const visibleWaitingUsers = !myTeam && user && !waitingUsers.some((p) => sameId(p.userId, user.id))
    ? [{ userId: normalizeId(user.id), username: user.username, role: 'MEMBER', isLocalUser: true }, ...waitingUsers]
    : waitingUsers;

  // 인증 로딩 중이거나 미로그인 상태 — auth useEffect가 리다이렉트 처리
  if (authLoading || !user) return null;

  if (loading) return <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8060' }}>불러오는 중...</div>;
  if (error && !room) return <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 헤더 ── */}
      <div style={{ background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)', padding: '0 24px', height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#8A8060', cursor: 'pointer', fontSize: 18, padding: 4 }}>←</button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>팀 구성</div>
            <div style={{ fontSize: 10, color: '#8A8060' }}>{room?.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 방 코드 + 클립보드 복사 */}
          <CopyCodeBadge code={room?.code} />
          <button
            onClick={() => setShowRoleGuide(true)}
            title="역할 안내"
            style={{ background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.22)', color: '#8A8060', width: 30, height: 30, borderRadius: 4, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}
          >?</button>
          <Button variant="ghost" onClick={() => setShowRuleModal(true)} style={{ fontSize: 12, padding: '7px 14px' }}>⚙ 룰 수정</Button>
        </div>
      </div>

      {/* ── 룰 요약 배너 ── */}
      <div style={{ background: '#1a1800', borderBottom: '1px solid rgba(200,155,0,0.1)', padding: '8px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#8A8060' }}>현재 룰:</span>
        {[
          { label: room?.rule?.gameMode },
          { label: `목표 ${room?.rule?.targetKills}킬` },
          { label: room?.rule?.noTimeLimit ? '시간제한 없음' : `${room?.rule?.timeLimitMin}분` },
          ...(room?.rule?.headShotBonusOn   ? [{ label: `헤드샷 +${room.rule.headShotBonus}`,   color: '#F5A623' }] : []),
          ...(room?.rule?.assistBonusOn     ? [{ label: `어시스트 +${room.rule.assistBonus}`,   color: '#F5A623' }] : []),
          ...(room?.rule?.chickenBonusOn    ? [{ label: `치킨 +${room.rule.chickenBonus}`,      color: '#F5A623' }] : []),
          ...(room?.rule?.teamKillPenaltyOn ? [{ label: `팀킬 -${room.rule.teamKillPenalty}`,   color: '#E53935' }] : []),
          ...(room?.rule?.deathPenaltyOn    ? [{ label: `사망 -${room.rule.deathPenalty}`,      color: '#E53935' }] : []),
        ].map((tag, i) => (
          <span key={i} style={{ padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.2)', color: tag.color || '#E8DFC0' }}>{tag.label}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8A8060', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowRuleModal(true)}>수정하기</span>
      </div>

      {/* ── 내 현재 위치 안내 ── */}
      {myTeam ? (
        <div style={{ background: 'rgba(245,166,35,0.06)', borderBottom: '1px solid rgba(200,155,0,0.1)', padding: '8px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: '#8A8060' }}>나의 위치:</span>
          <span style={{ color: '#F5A623', fontWeight: 700 }}>{myTeam.name}</span>
          {isHost ? (
            <span style={{ padding: '1px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: '#FFD700', color: '#1a1500' }}>
              👑 방장
            </span>
          ) : (
            <span style={{ padding: '1px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: '#F5A623', color: '#1a1500' }}>
              ★ LEADER
            </span>
          )}
          <span style={{ fontSize: 11, color: '#8A8060' }}>
            {isHost ? '— 닉네임 관리 · 게임 시작 · OCR 업로드 권한 있음' : '— 내 팀 OCR 업로드 및 결과 입력 권한 있음'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8A8060' }}>
            💡 배그 닉네임은 아래에서 별도 입력 필요
          </span>
        </div>
      ) : (
        <div style={{ background: 'rgba(100,100,100,0.08)', borderBottom: '1px solid rgba(200,155,0,0.1)', padding: '10px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
          <span style={{ padding: '2px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, background: 'rgba(200,155,0,0.12)', color: '#8A8060', border: '1px solid rgba(200,155,0,0.2)' }}>
            ⏳ 대기석
          </span>
          <span style={{ color: '#8A8060' }}>
            {user?.username ? `${user.username}님은 아직 팀에 참여하지 않았습니다. 아래에서 참여할 팀을 선택하세요.` : '아직 팀에 참여하지 않았습니다. 아래에서 참여할 팀을 선택하세요.'}
          </span>
        </div>
      )}

      {/* ── 대기석 유저 목록 ── */}
      {(() => {
        if (visibleWaitingUsers.length === 0) return null;
        return (
          <div style={{ background: 'rgba(100,100,100,0.05)', borderBottom: '1px solid rgba(200,155,0,0.08)', padding: '8px 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1 }}>⏳ 대기석 ({visibleWaitingUsers.length}명)</span>
              {isHost && <span style={{ fontSize: 10, color: '#8A8060' }}>— 유저 옆 버튼을 눌러 팀에 배정할 수 있습니다</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {visibleWaitingUsers.map((p) => {
                const isMe       = sameId(p.userId, user?.id);
                const isHostUser = sameId(p.userId, hostUserId);
                const isOpen     = assignDropdown === p.userId;

                return (
                  <div key={p.userId} style={{ position: 'relative' }}>
                    {/* 유저 칩 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: isHost && !isMe ? '3px 6px 3px 10px' : '3px 10px',
                      borderRadius: 12,
                      background: isMe ? 'rgba(245,166,35,0.12)' : 'rgba(200,155,0,0.07)',
                      border: `1px solid ${isOpen ? 'rgba(245,166,35,0.5)' : isMe ? 'rgba(245,166,35,0.3)' : 'rgba(200,155,0,0.15)'}`,
                      fontSize: 11,
                    }}>
                      <span>{isHostUser ? '👑' : '👤'}</span>
                      <span style={{ color: isMe ? '#F5A623' : '#E8DFC0', fontWeight: isMe ? 700 : 400 }}>
                        {p.username}{isMe ? ' (나)' : ''}
                      </span>
                      {isHostUser && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, background: '#FFD700', color: '#1a1500', fontWeight: 700 }}>방장</span>
                      )}
                      {/* 배정 버튼 — 방장 전용, 자기 자신 제외 */}
                      {isHost && !isMe && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setAssignDropdown(isOpen ? null : p.userId); }}
                          style={{
                            background: isOpen ? 'rgba(245,166,35,0.2)' : 'rgba(200,155,0,0.1)',
                            border: `1px solid ${isOpen ? 'rgba(245,166,35,0.5)' : 'rgba(200,155,0,0.25)'}`,
                            color: '#F5A623', fontSize: 10, fontWeight: 700,
                            padding: '2px 7px', borderRadius: 8,
                            cursor: 'pointer', fontFamily: 'inherit',
                            marginLeft: 4, whiteSpace: 'nowrap',
                          }}
                        >
                          팀 배정 {isOpen ? '▲' : '▼'}
                        </button>
                      )}
                    </div>

                    {/* 팀 선택 드롭다운 */}
                    {isHost && isOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
                        background: '#1C1A0C',
                        border: '1px solid rgba(200,155,0,0.35)',
                        borderRadius: 6, overflow: 'hidden',
                        minWidth: 180,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                      }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(200,155,0,0.12)', fontSize: 10, color: '#8A8060', letterSpacing: 1 }}>
                          {p.username}님을 배정할 팀 선택
                        </div>
                        {room.teams.map((team) => {
                          const occupied = (team.members || []).length > 0;
                          return (
                            <button
                              key={team.id}
                              disabled={occupied}
                              onClick={() => handleAssignToTeam(p.userId, p.username, team.id)}
                              style={{
                                width: '100%', textAlign: 'left',
                                padding: '9px 14px',
                                background: 'none',
                                border: 'none',
                                borderBottom: '1px solid rgba(200,155,0,0.07)',
                                color: occupied ? '#444' : '#E8DFC0',
                                fontSize: 12, fontFamily: 'inherit',
                                cursor: occupied ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              }}
                              onMouseEnter={(e) => { if (!occupied) e.currentTarget.style.background = 'rgba(245,166,35,0.08)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                            >
                              <span style={{ fontWeight: 600 }}>{team.name}</span>
                              {occupied
                                ? <span style={{ fontSize: 10, color: '#555' }}>자리 없음</span>
                                : <span style={{ fontSize: 10, color: '#F5A623', fontWeight: 700 }}>★ LEADER</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
          {room?.teams.map((team) => {
            const isFull = team.players.length >= maxPerTeam;
            const isMyTeam = team.id === myTeam?.id;
            const teamMembers = team.members || [];
            // 팀에 이미 로그인 유저가 있으면 이동 불가 (팀당 1명 제한)
            const teamHasMember = teamMembers.length > 0;

            return (
              <div key={team.id} style={{ background: '#1C1A0C', border: `1px solid ${isMyTeam ? 'rgba(245,166,35,0.45)' : 'rgba(200,155,0,0.18)'}`, borderRadius: 8, overflow: 'hidden' }}>

                {/* 팀 헤더 */}
                <div style={{ background: isMyTeam ? 'rgba(245,166,35,0.1)' : 'rgba(200,155,0,0.06)', borderBottom: '1px solid rgba(200,155,0,0.12)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: isMyTeam ? '#F5A623' : '#8A8060' }}>{team.name}</span>
                      {isMyTeam && <span style={{ fontSize: 10, background: '#F5A623', color: '#1a1500', padding: '1px 6px', borderRadius: 2, fontWeight: 700 }}>MY TEAM</span>}
                    </div>
                    {/* 팀 인원 현황 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* 로그인 유저 슬롯 (팀당 1명 제한) */}
                      <span style={{ fontSize: 10, color: teamHasMember ? '#F5A623' : '#555', background: 'rgba(200,155,0,0.07)', border: '1px solid rgba(200,155,0,0.12)', borderRadius: 3, padding: '1px 6px' }}>
                        👤 {teamMembers.length}/1
                      </span>
                      {/* 배그 닉네임 슬롯 */}
                      <span style={{ fontSize: 10, color: isFull ? '#E53935' : team.players.length > 0 ? '#F5A623' : '#555', background: 'rgba(200,155,0,0.07)', border: `1px solid ${isFull ? 'rgba(229,57,53,0.25)' : 'rgba(200,155,0,0.12)'}`, borderRadius: 3, padding: '1px 6px' }}>
                        🎮 {team.players.length}/{maxPerTeam}
                      </span>
                    </div>
                  </div>
                  {/* 버튼 영역 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* 팀 삭제 버튼 — 방장 전용, 멤버·플레이어 없을 때만 활성화 */}
                    {isHost && (
                      (() => {
                        const canDelete = (team.members || []).length === 0 && team.players.length === 0;
                        return (
                          <button
                            onClick={() => handleRemoveTeam(team.id)}
                            disabled={!canDelete}
                            title={canDelete ? '팀 삭제' : '멤버 또는 닉네임이 있으면 삭제할 수 없습니다'}
                            style={{
                              background: 'none',
                              border: `1px solid ${canDelete ? 'rgba(229,57,53,0.35)' : 'rgba(100,100,100,0.2)'}`,
                              color: canDelete ? '#E53935' : '#444',
                              width: 26, height: 26, borderRadius: 3,
                              cursor: canDelete ? 'pointer' : 'not-allowed',
                              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'inherit', flexShrink: 0,
                              opacity: canDelete ? 1 : 0.45,
                            }}
                          >
                            🗑
                          </button>
                        );
                      })()
                    )}
                    {/* 내 팀이면 대기석으로 이동 버튼, 아니면 참여/이동 버튼 */}
                    {isMyTeam ? (
                      <button onClick={handleLeaveTeam} style={{ background: 'none', border: '1px solid rgba(229,57,53,0.3)', color: '#E53935', fontSize: 11, padding: '3px 9px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}>
                        대기석으로
                      </button>
                    ) : (
                      teamHasMember ? (
                        <span style={{ fontSize: 10, color: '#555', padding: '3px 9px' }}>자리 없음</span>
                      ) : (
                        <button onClick={() => handleMoveTeam(team.id)} style={{ background: 'none', border: '1px solid rgba(200,155,0,0.3)', color: '#8A8060', fontSize: 11, padding: '3px 9px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {myTeam ? '이 팀으로 이동' : '이 팀으로 참여'}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 로그인 유저 목록 (방 참여자) */}
                {teamMembers.length > 0 && (
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(200,155,0,0.08)', background: 'rgba(200,155,0,0.03)' }}>
                    <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>방 참여자</div>
                    {teamMembers.map((member) => {
                      const isMe       = sameId(member.userId, user?.id);
                      const dropKey    = `${team.id}-${member.userId}`;
                      const isMenuOpen = memberDropdown === dropKey;
                      // 방장이 제어 가능한 조건: 내가 방장이고, 해당 멤버가 나 자신이 아닐 때
                      const canControl = isHost && !isMe;
                      // 이동 가능한 다른 팀 목록 (빈 자리 있는 팀만)
                      const otherTeams = room.teams.filter(
                        (t) => t.id !== team.id && (t.members || []).length === 0
                      );

                      return (
                        <div key={member.userId} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(200,155,0,0.05)' }}>
                          {/* 유저 정보 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 22, height: 22, background: isMe ? 'rgba(245,166,35,0.2)' : 'rgba(200,155,0,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                            <span style={{ fontSize: 12, color: isMe ? '#F5A623' : '#E8DFC0', fontWeight: isMe ? 700 : 400 }}>
                              {member.username}{isMe && ' (나)'}
                            </span>
                          </div>

                          {/* 오른쪽: 배지 + 방장 제어 버튼 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* 역할 배지 */}
                            {sameId(member.userId, hostUserId) && (
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, fontWeight: 700, background: '#FFD700', color: '#1a1500' }}>
                                👑 방장
                              </span>
                            )}
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, fontWeight: 700, background: '#F5A623', color: '#1a1500' }}>
                              ★ LEADER
                            </span>

                            {/* 방장 전용 제어 메뉴 버튼 */}
                            {canControl && (
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setMemberDropdown(isMenuOpen ? null : dropKey); }}
                                  title="멤버 이동 옵션"
                                  style={{
                                    background: isMenuOpen ? 'rgba(245,166,35,0.15)' : 'rgba(200,155,0,0.08)',
                                    border: `1px solid ${isMenuOpen ? 'rgba(245,166,35,0.4)' : 'rgba(200,155,0,0.2)'}`,
                                    color: '#8A8060', fontSize: 11,
                                    width: 22, height: 22, borderRadius: 3,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  ⋮
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {isMenuOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 300,
                                      background: '#1C1A0C',
                                      border: '1px solid rgba(200,155,0,0.35)',
                                      borderRadius: 6, overflow: 'hidden',
                                      minWidth: 170,
                                      boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                                    }}
                                  >
                                    <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(200,155,0,0.12)', fontSize: 10, color: '#8A8060', letterSpacing: 1 }}>
                                      {member.username} 이동
                                    </div>

                                    {/* 대기석으로 */}
                                    <button
                                      onClick={() => handleMoveToWaiting(team.id, member.userId, member.username)}
                                      style={{
                                        width: '100%', textAlign: 'left',
                                        padding: '9px 14px',
                                        background: 'none', border: 'none',
                                        borderBottom: otherTeams.length > 0 ? '1px solid rgba(200,155,0,0.08)' : 'none',
                                        color: '#E8DFC0', fontSize: 12,
                                        fontFamily: 'inherit', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229,57,53,0.07)'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                    >
                                      <span>⏳</span>
                                      <span>대기석으로 이동</span>
                                    </button>

                                    {/* 다른 팀으로 이동 */}
                                    {otherTeams.length > 0 && (
                                      <>
                                        <div style={{ padding: '5px 12px 3px', fontSize: 10, color: '#555', letterSpacing: 0.5 }}>다른 팀 LEADER로</div>
                                        {otherTeams.map((t) => (
                                          <button
                                            key={t.id}
                                            onClick={() => handleMoveMemberToTeam(member.userId, member.username, t.id)}
                                            style={{
                                              width: '100%', textAlign: 'left',
                                              padding: '8px 14px',
                                              background: 'none', border: 'none',
                                              borderTop: '1px solid rgba(200,155,0,0.06)',
                                              color: '#E8DFC0', fontSize: 12,
                                              fontFamily: 'inherit', cursor: 'pointer',
                                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.07)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                          >
                                            <span>{t.name}</span>
                                            <span style={{ fontSize: 10, color: '#F5A623', fontWeight: 700 }}>★ LEADER</span>
                                          </button>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 배그 닉네임 목록 (킬내기 참가자) */}
                <div style={{ padding: '10px 14px', minHeight: 48 }}>
                  <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 1, marginBottom: 6 }}>배그 닉네임 (킬내기 참가자)</div>
                  {team.players.length === 0 ? (
                    <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>닉네임을 입력해주세요</div>
                  ) : (
                    team.players.map((nick) => (
                      <div key={nick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(200,155,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A623', flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{nick}</span>
                        </div>
                        {isHost && <button onClick={() => removePlayer(team.id, nick)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>✕</button>}
                      </div>
                    ))
                  )}
                </div>

                {/* 닉네임 입력창 — 방장만 표시 */}
                {isHost && (
                  !isFull ? (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(200,155,0,0.08)', display: 'flex', gap: 8 }}>
                      <input
                        value={inputs[team.id] || ''}
                        onChange={(e) => setInputs((p) => ({ ...p, [team.id]: e.target.value.replace(/\s/g, '') }))}
                        onKeyDown={(e) => e.key === 'Enter' && addPlayer(team.id)}
                        placeholder="배그 닉네임..."
                        style={{ flex: 1, background: '#141200', border: '1px solid rgba(200,155,0,0.22)', color: '#E8DFC0', padding: '7px 10px', borderRadius: 4, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                      />
                      <button onClick={() => addPlayer(team.id)} style={{ background: 'rgba(200,155,0,0.1)', border: '1px solid rgba(200,155,0,0.3)', color: '#F5A623', padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>추가</button>
                    </div>
                  ) : (
                    <div style={{ padding: '7px 14px', borderTop: '1px solid rgba(200,155,0,0.08)', fontSize: 11, color: '#555', textAlign: 'center' }}>{maxPerTeam}명 완료</div>
                  )
                )}
              </div>
            );
          })}

          {/* 팀 추가 */}
          {(room?.teams.length || 0) < 6 && (
            <div onClick={handleAddTeam} style={{ background: '#1C1A0C', border: '1px dashed rgba(200,155,0,0.18)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer', color: '#555', fontSize: 13, gap: 8 }}>
              <span style={{ fontSize: 18 }}>+</span> 팀 추가
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 시작 버튼 ── */}
      <div style={{ background: '#1C1A0C', borderTop: '1px solid rgba(200,155,0,0.18)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#8A8060' }}>
          {canStart
            ? `✓ 준비 완료 — ${room?.teams.length}개 팀, 총 ${totalPlayers}명`
            : (room?.teams.length ?? 0) < 2
              ? '팀이 2개 이상 필요합니다'
              : `배그 닉네임을 팀 전체 합산 2명 이상 입력해주세요 (현재 ${totalPlayers}명)`}
        </div>
        <Button onClick={handleStart} loading={starting} disabled={!canStart} size="lg" style={{ minWidth: 160 }}>
          킬내기 시작 ▶
        </Button>
      </div>

      {/* ── 룰 수정 모달 ── */}
      {showRuleModal && (
        <RuleEditModal rule={room.rule} onSave={handleSaveRule} onClose={() => setShowRuleModal(false)} />
      )}

      {/* ── 역할 안내 모달 ── */}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}
