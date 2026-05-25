/**
 * ============================================================
 *  라이브 스코어보드  /room/:id/live
 * ============================================================
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';
import { useWebSocket } from '@/lib/useWebSocket';
import { mapSessionRule } from '@/features/setup/helpers/mappers';
import { useTheme } from '@/lib/theme-context';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import RoleGuideModal from '@/components/ui/RoleGuideModal';

// ─────────────────────────────────────────
//  점수 계산 유틸
// ─────────────────────────────────────────

function calcTeamScore(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;
  for (const m of matches) {
    const teamResults = (m.memberResults || []).filter((r) => r.teamId === teamId);
    if (teamResults.length === 0) continue;
    const hasChicken = teamResults.some((r) => r.isChicken);
    if (rule.chickenBonusOn && hasChicken) bonus += rule.chickenBonus;
    for (const r of teamResults) {
      kills += r.kills;
      if (rule.survivalPenaltyOn && !r.isTop10) penalty += rule.survivalPenalty;
    }
  }
  const adj = adjustments
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);
  return { kills, bonus, penalty, adj, total: kills + bonus - penalty + adj };
}

function calcPlayerStats(nick, matches, rule) {
  let kills = 0, bonus = 0, penalty = 0, damage = 0;
  for (const m of matches) {
    for (const r of (m.memberResults || [])) {
      if (r.playerNickname !== nick) continue;
      kills  += r.kills;
      damage += r.damage || 0;
      if (rule.survivalPenaltyOn && !r.isTop10) penalty += rule.survivalPenalty;
    }
  }
  return { kills, bonus, penalty, damage, total: kills + bonus - penalty };
}

const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
};

const fmtMMSS = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
};

// ─────────────────────────────────────────
//  작은 토글
// ─────────────────────────────────────────

const ToggleMini = ({ on, onChange }) => (
  <div onClick={onChange} style={{ width: 34, height: 18, borderRadius: 9, background: on ? 'var(--kn-accent)' : 'var(--kn-surface-3)', border: '1px solid var(--kn-border)', cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 1, left: on ? 16 : 1, width: 14, height: 14, borderRadius: '50%', background: on ? 'var(--kn-bg)' : 'var(--kn-text-muted)', transition: 'left .15s' }} />
  </div>
);

const btnStyle = { width: 24, height: 26, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-accent)', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' };

// ─────────────────────────────────────────
//  팀별 매치 결과 입력 모달
// ─────────────────────────────────────────

function TeamResultModal({ room, teamId, matchNumber, sessionId, onConfirmed, onClose }) {
  const { teams, rule } = room;
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const [results, setResults] = useState(
    (team.players || []).map((p) => ({
      nick: typeof p === 'string' ? p : p.nickname, teamId,
      kills: 0, damage: 0,
      assists: 0, isTop10: false,
    }))
  );
  const [claimsChicken, setClaimsChicken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrUnmatched, setOcrUnmatched] = useState([]);
  const [ocrFilledNicks, setOcrFilledNicks] = useState(new Set());
  const [matchId, setMatchId] = useState(null);
  const [ocrMapName, setOcrMapName] = useState('');
  const [ocrPlacement, setOcrPlacement] = useState(0);
  const [ocrPlayTime, setOcrPlayTime] = useState('');

  const setR = (nick, key, val) =>
    setResults((prev) => prev.map((r) => r.nick === nick ? { ...r, [key]: val } : r));

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setOcrError('이미지 파일만 업로드 가능합니다'); return; }
    setOcrFile(file); setOcrError(''); setOcrDone(false); setOcrFilledNicks(new Set());
    setMatchId(null); setOcrMapName(''); setOcrPlacement(0); setOcrPlayTime('');
    setOcrPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileChange(file); };

  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrLoading(true); setOcrError(''); setOcrProgress(0);
    const progressTimer = setInterval(() => { setOcrProgress((prev) => (prev < 90 ? prev + Math.random() * 15 : prev)); }, 400);
    const res = await RoomAPI.uploadMatchImage(sessionId, ocrFile);
    clearInterval(progressTimer); setOcrProgress(100);
    await new Promise((r) => setTimeout(r, 300));
    setOcrLoading(false);

    if (!res.success) { setOcrError(res.error || '이미지 업로드/OCR 처리에 실패했습니다'); return; }
    const data = res.data || res;
    setMatchId(data.matchId);
    const ocr = data.ocrResult;
    if (ocr) {
      setOcrMapName(ocr.mapName || ''); setOcrPlacement(ocr.placement || 0); setOcrPlayTime(ocr.playTime || '');
      if (ocr.placement === 1) setClaimsChicken(true);
      const stats = ocr.playerStats || [];
      const filled = new Set();
      setResults((prev) => prev.map((row) => {
        const matched = stats.find((p) => p.nickname?.toLowerCase() === row.nick.toLowerCase());
        if (!matched) return row;
        filled.add(row.nick);
        return { ...row, kills: matched.kills ?? row.kills, damage: matched.damage ?? row.damage };
      }));
      setOcrFilledNicks(filled);
      const teamNicks = new Set((team.players || []).map((p) => (typeof p === 'string' ? p : p.nickname).toLowerCase()));
      setOcrUnmatched(stats.filter((p) => !teamNicks.has(p.nickname?.toLowerCase())));
    }
    setOcrDone(true);
  };

  // ── 미매칭 OCR 결과를 팀원에 수동 매핑 ──
  const handleOcrMapping = (ocrNickname, teamNick) => {
    if (!teamNick) return;
    const ocrItem = ocrUnmatched.find((u) => u.nickname === ocrNickname);
    if (!ocrItem) return;
    setResults((prev) => prev.map((r) =>
      r.nick === teamNick
        ? { ...r, kills: ocrItem.kills ?? r.kills, damage: ocrItem.damage ?? r.damage }
        : r
    ));
    setOcrUnmatched((prev) => prev.filter((u) => u.nickname !== ocrNickname));
    setOcrFilledNicks((prev) => new Set([...prev, teamNick]));
  };

  const unmappedTeamNicks = results
    .filter((r) => !ocrFilledNicks.has(r.nick))
    .map((r) => r.nick);

  const previewKills = results.reduce((s, r) => s + r.kills, 0);
  const previewBonus = claimsChicken && rule.chickenBonusOn ? rule.chickenBonus : 0;
  const previewPenalty = rule.survivalPenaltyOn
    ? results.filter((r) => !r.isTop10).length * rule.survivalPenalty
    : 0;
  const previewTotal = previewKills + previewBonus - previewPenalty;

  const handleSubmit = async () => {
    if (!matchId) { setOcrError('먼저 스크린샷을 업로드하고 분석을 완료해주세요'); return; }
    setSubmitting(true);
    const playerResults = results.map((r) => ({ nickname: r.nick, kills: r.kills, damage: r.damage || 0, assists: r.assists || 0, isTop10: r.isTop10 || false }));
    const confirmRes = await RoomAPI.confirmMatch(matchId, { playerResults, isChicken: claimsChicken, mapName: ocrMapName, placement: ocrPlacement, playTime: ocrPlayTime });
    setSubmitting(false);
    if (!confirmRes.success) { setOcrError(confirmRes.error || '매치 확정에 실패했습니다'); return; }
    onConfirmed?.();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 16 }}>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-xl)', width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* 헤더 */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--kn-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'var(--kn-w-bold)' }}>
              {team.name} — {matchNumber}번째 게임 결과 입력
            </div>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>
              우리 팀({(team.players || []).length}명) 결과만 입력합니다 · 스크린샷 OCR 또는 직접 입력
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', width: 28, height: 28, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 22px' }}>

          {/* OCR 스크린샷 업로드 영역 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="image" size={14} /> 스크린샷 OCR 자동 입력
              <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>(선택 사항)</span>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('ocr-file-input').click()}
              style={{
                border: `2px dashed ${ocrFile ? 'color-mix(in oklab, var(--kn-accent) 50%, transparent)' : 'var(--kn-border)'}`,
                borderRadius: 'var(--kn-r-lg)', padding: '14px 16px',
                background: ocrFile ? 'color-mix(in oklab, var(--kn-accent) 5%, transparent)' : 'var(--kn-surface-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color .2s',
              }}
            >
              <input id="ocr-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e.target.files[0])} />

              {ocrPreview ? (
                <img src={ocrPreview} alt="미리보기" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 'var(--kn-r-md)', border: '1px solid var(--kn-border)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 50, background: 'var(--kn-surface-3)', borderRadius: 'var(--kn-r-md)', border: '1px solid var(--kn-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="image" size={22} color="var(--kn-text-dim)" />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {ocrFile ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ocrFile.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>{(ocrFile.size / 1024).toFixed(0)} KB · 클릭하여 다시 선택</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--kn-text-muted)' }}>클릭하거나 파일을 여기에 드래그하세요</div>
                    <div style={{ fontSize: 11, color: 'var(--kn-text-dim)', marginTop: 2 }}>jpg, png 등 이미지 파일</div>
                  </div>
                )}
              </div>

              {ocrFile && !ocrLoading && (
                <Button variant="primary" onClick={(e) => { e.stopPropagation(); handleOcr(); }} style={{ flexShrink: 0 }}>분석</Button>
              )}

              {ocrLoading && (
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: 'var(--kn-accent)', fontWeight: 600 }}>분석 중 {Math.round(ocrProgress)}%</div>
                  <div style={{ width: 80, height: 6, background: 'var(--kn-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'var(--kn-accent)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {ocrDone && !ocrError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'color-mix(in oklab, var(--kn-success) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-success) 25%, transparent)', borderRadius: 'var(--kn-r-md)', fontSize: 11, color: 'var(--kn-success)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Icon name="check" size={13} /> OCR 완료 — {ocrFilledNicks.size}명 자동 입력됨
                {ocrMapName && <span style={{ color: 'var(--kn-text-muted)' }}>맵: {ocrMapName}</span>}
                {ocrPlacement > 0 && <span style={{ color: 'var(--kn-text-muted)' }}>순위: #{ocrPlacement}</span>}
              </div>
            )}

            {/* 미매칭 OCR 결과 — 수동 매핑 UI */}
            {ocrDone && ocrUnmatched.length > 0 && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'color-mix(in oklab, var(--kn-accent) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-accent) 25%, transparent)', borderRadius: 'var(--kn-r-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--kn-accent)', fontWeight: 600, marginBottom: 8 }}>
                  닉네임 미매칭 {ocrUnmatched.length}건 — 팀원을 선택해 연결하세요
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ocrUnmatched.map((u) => (
                    <div key={u.nickname} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: 'var(--kn-surface-1)', borderRadius: 'var(--kn-r-md)', border: '1px solid var(--kn-border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kn-text)', minWidth: 80 }}>"{u.nickname}"</span>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>킬 {u.kills ?? 0}</span>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>데미지 {u.damage ?? 0}</span>
                      <Icon name="arrow-right" size={12} color="var(--kn-text-dim)" />
                      <select
                        defaultValue=""
                        onChange={(e) => { handleOcrMapping(u.nickname, e.target.value); e.target.value = ''; }}
                        style={{ flex: 1, background: 'var(--kn-surface-3)', border: '1px solid color-mix(in oklab, var(--kn-accent) 30%, transparent)', color: 'var(--kn-text)', padding: '5px 8px', borderRadius: 'var(--kn-r-md)', fontSize: 12, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="">팀원 선택...</option>
                        {unmappedTeamNicks.map((nick) => (
                          <option key={nick} value={nick}>{nick}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ocrError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'color-mix(in oklab, var(--kn-danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)', borderRadius: 'var(--kn-r-md)', fontSize: 11, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert" size={13} /> {ocrError}
              </div>
            )}
          </div>

          {/* 치킨 여부 */}
          <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="trophy" size={20} color="var(--kn-accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>우리 팀({team.name})이 치킨을 먹었나요?</span>
            <ToggleMini on={claimsChicken} onChange={() => setClaimsChicken((v) => !v)} />
            {claimsChicken && rule.chickenBonusOn && (
              <span style={{ fontSize: 12, color: 'var(--kn-success)' }}>+{rule.chickenBonus} 보너스</span>
            )}
          </div>

          {/* 플레이어별 입력 */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--kn-border)' }}>
                  {['닉네임', '킬', '데미지', '어시스트', '개인 등수 10등 이내'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--kn-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isOcrFilled = ocrFilledNicks.has(r.nick);
                  return (
                    <tr key={r.nick} style={{ borderBottom: '1px solid var(--kn-border)', background: isOcrFilled ? 'color-mix(in oklab, var(--kn-accent) 4%, transparent)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        {isOcrFilled && <span style={{ fontSize: 9, color: 'var(--kn-accent)', marginRight: 4, verticalAlign: 'middle' }}>OCR</span>}
                        {r.nick}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => setR(r.nick, 'kills', Math.max(0, r.kills - 1))} style={btnStyle}>−</button>
                          <span style={{ width: 32, textAlign: 'center', lineHeight: '26px', background: 'var(--kn-surface-3)', borderTop: '1px solid var(--kn-border-strong)', borderBottom: '1px solid var(--kn-border-strong)', fontWeight: 700, color: 'var(--kn-accent)', fontFamily: 'var(--kn-font-mono)' }}>{r.kills}</span>
                          <button onClick={() => setR(r.nick, 'kills', r.kills + 1)} style={btnStyle}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={r.damage} min={0}
                          onChange={(e) => setR(r.nick, 'damage', parseInt(e.target.value)||0)}
                          style={{ width: 70, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', padding: '4px 8px', borderRadius: 'var(--kn-r-md)', fontSize: 12, outline: 'none', fontFamily: 'var(--kn-font-mono)', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => setR(r.nick, 'assists', Math.max(0, (r.assists||0) - 1))} style={btnStyle}>−</button>
                          <span style={{ width: 32, textAlign: 'center', lineHeight: '26px', background: 'var(--kn-surface-3)', borderTop: '1px solid var(--kn-border-strong)', borderBottom: '1px solid var(--kn-border-strong)', fontWeight: 700, color: 'var(--kn-accent)', fontFamily: 'var(--kn-font-mono)' }}>{r.assists||0}</span>
                          <button onClick={() => setR(r.nick, 'assists', (r.assists||0) + 1)} style={btnStyle}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}><ToggleMini on={r.isTop10} onChange={() => setR(r.nick, 'isTop10', !r.isTop10)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 점수 미리보기 */}
          <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', letterSpacing: 1, marginBottom: 8 }}>이번 매치 {team.name} 점수 미리보기</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', marginBottom: 2 }}>총점</div>
                <div data-display="" style={{ fontSize: 32, color: 'var(--kn-accent)' }}>{previewTotal}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', paddingBottom: 4 }}>
                킬 <b style={{ color: 'var(--kn-text)' }}>{previewKills}</b>
                &nbsp;+<b style={{ color: 'var(--kn-success)' }}>{previewBonus}</b>
                &nbsp;-<b style={{ color: 'var(--kn-danger)' }}>{previewPenalty}</b>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting} icon="check">우리 팀 결과 제출</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  스크린샷 뷰어 모달
// ─────────────────────────────────────────

function ScreenshotModal({ info, onClose }) {
  const { url, match, team } = info;
  const totalKills = (match.results || []).reduce((s, r) => s + r.kills, 0);
  const hasChicken = match.chickenTeamId === match.teamId;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20, backdropFilter: 'blur(6px)' }}>
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
        <img src={url} alt={`${team?.name} 결과`} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--kn-r-lg)', border: '1px solid var(--kn-border)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  룰 헬퍼 컴포넌트
// ─────────────────────────────────────────

const RuleRow = ({ label, desc, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--kn-border)', gap: 12 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)' }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 1 }}>{desc}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const RuleBonusRow = ({ label, on, onToggle, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--kn-border)', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <ToggleMini on={on} onChange={onToggle} />
      <span style={{ fontSize: 13, fontWeight: 'var(--kn-w-semi)', color: on ? 'var(--kn-text)' : 'var(--kn-text-dim)' }}>{label}</span>
    </div>
    <div style={{ flexShrink: 0, opacity: on ? 1 : 0.3, pointerEvents: on ? 'auto' : 'none' }}>{children}</div>
  </div>
);

const NumberStepper = ({ val, min = 0, max = 99, onChange, color = 'var(--kn-accent)', disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <button onClick={() => onChange(Math.max(min, val - 1))} disabled={disabled}
      style={{ width: 24, height: 26, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: 'var(--kn-r-sm) 0 0 var(--kn-r-sm)' }}>−</button>
    <span style={{ width: 36, textAlign: 'center', lineHeight: '26px', background: 'var(--kn-surface-3)', borderTop: '1px solid var(--kn-border-strong)', borderBottom: '1px solid var(--kn-border-strong)', fontWeight: 700, color, fontSize: 15, fontFamily: 'var(--kn-font-mono)' }}>{val}</span>
    <button onClick={() => onChange(Math.min(max, val + 1))} disabled={disabled}
      style={{ width: 24, height: 26, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: '0 var(--kn-r-sm) var(--kn-r-sm) 0' }}>+</button>
  </div>
);

const rBtnStyle = { width: 26, height: 28, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: 'var(--kn-r-sm)' };

// ─────────────────────────────────────────
//  운영 메뉴 모달
// ─────────────────────────────────────────

function AdminModal({ room, onAdjust, onEnd, onRuleUpdate, onClose }) {
  const [view, setView] = useState('menu');
  const [adjTeamId, setAdjTeamId] = useState(room.teams[0]?.id || '');
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjSign, setAdjSign] = useState('+');
  const [adjReason, setAdjReason] = useState('');
  const [endConfirm, setEndConfirm] = useState('');
  const [rule, setRule] = useState({ ...room.rule });
  const [ruleSaving, setRuleSaving] = useState(false);
  const setR = (key, val) => setRule((prev) => ({ ...prev, [key]: val }));

  const handleRuleSave = async () => { setRuleSaving(true); await onRuleUpdate(rule); setRuleSaving(false); onClose(); };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-xl)', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--kn-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="settings" size={18} /> 운영 메뉴</div>
          <button onClick={onClose} style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', width: 28, height: 28, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { v: 'adjust', icon: 'zap', title: '점수 조정', desc: '팀 점수를 수동으로 가감합니다' },
                { v: 'rule', icon: 'settings', title: '룰 변경', desc: '목표 킬, 보너스/패널티 등 규칙을 수정합니다' },
                { v: 'end', icon: 'flag', title: '경기 종료', desc: '킬내기를 즉시 종료하고 결과를 확정합니다', danger: true },
              ].map((item) => (
                <div key={item.v} onClick={() => setView(item.v)} style={{
                  padding: '14px 16px', background: 'var(--kn-surface-2)',
                  border: `1px solid ${item.danger ? 'color-mix(in oklab, var(--kn-danger) 30%, transparent)' : 'var(--kn-border)'}`,
                  borderRadius: 'var(--kn-r-lg)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Icon name={item.icon} size={20} color={item.danger ? 'var(--kn-danger)' : 'var(--kn-text-muted)'} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: item.danger ? 'var(--kn-danger)' : 'var(--kn-text)' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'adjust' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="back" size={14} /> 메뉴로</button>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>대상 팀</div>
                <select value={adjTeamId} onChange={(e) => setAdjTeamId(e.target.value)}
                  style={{ width: '100%', background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {room.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>조정 방향</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['+', '-'].map((s) => (
                      <div key={s} onClick={() => setAdjSign(s)} style={{
                        flex: 1, padding: '9px', textAlign: 'center',
                        border: `1px solid ${adjSign === s ? (s === '+' ? 'var(--kn-success)' : 'var(--kn-danger)') : 'var(--kn-border)'}`,
                        background: adjSign === s ? (s === '+' ? 'color-mix(in oklab, var(--kn-success) 10%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 10%, transparent)') : 'var(--kn-surface-3)',
                        borderRadius: 'var(--kn-r-md)', cursor: 'pointer', fontWeight: 700, fontSize: 16,
                        color: adjSign === s ? (s === '+' ? 'var(--kn-success)' : 'var(--kn-danger)') : 'var(--kn-text-muted)',
                      }}>{s}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>조정 수치</div>
                  <input type="number" min={1} value={adjAmount} onChange={(e) => setAdjAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '100%', background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-accent)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'var(--kn-font-mono)', textAlign: 'center' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', marginBottom: 6 }}>사유 (필수)</div>
                <input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="예: 서버 오류로 인한 보상"
                  style={{ width: '100%', background: 'var(--kn-surface-3)', border: `1px solid ${adjReason.trim() ? 'var(--kn-border-strong)' : 'color-mix(in oklab, var(--kn-danger) 40%, transparent)'}`, color: 'var(--kn-text)', padding: '9px 12px', borderRadius: 'var(--kn-r-md)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                {!adjReason.trim() && <div style={{ fontSize: 11, color: 'var(--kn-danger)', marginTop: 4 }}>사유를 입력해야 반영할 수 있습니다</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="primary" disabled={!adjReason.trim()} onClick={() => { onAdjust(adjTeamId, adjSign === '+' ? adjAmount : -adjAmount, adjReason); onClose(); }}>반영하기</Button>
              </div>
            </div>
          )}

          {view === 'rule' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="back" size={14} /> 메뉴로</button>

              <RuleRow label="목표 킬 수" desc="이 킬 수에 도달하면 종료 안내가 표시됩니다">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setR('targetKills', Math.max(1, rule.targetKills - 1))} style={rBtnStyle}>−</button>
                  <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 18, color: 'var(--kn-accent)', fontFamily: 'var(--kn-font-mono)' }}>{rule.targetKills}</span>
                  <button onClick={() => setR('targetKills', rule.targetKills + 1)} style={rBtnStyle}>+</button>
                </div>
              </RuleRow>

              <RuleRow label="제한 시간" desc={rule.noTimeLimit ? '시간 제한 없음' : `${rule.timeLimitMin}분`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>제한없음</span>
                  <ToggleMini on={rule.noTimeLimit} onChange={() => setR('noTimeLimit', !rule.noTimeLimit)} />
                  {!rule.noTimeLimit && (
                    <>
                      <button onClick={() => setR('timeLimitMin', Math.max(10, rule.timeLimitMin - 10))} style={rBtnStyle}>−</button>
                      <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 16, color: 'var(--kn-text)', fontFamily: 'var(--kn-font-mono)' }}>{rule.timeLimitMin}</span>
                      <button onClick={() => setR('timeLimitMin', Math.min(480, rule.timeLimitMin + 10))} style={rBtnStyle}>+</button>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>분</span>
                    </>
                  )}
                </div>
              </RuleRow>

              <div style={{ borderTop: '1px solid var(--kn-border)', margin: '12px 0' }} />
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>보너스</span>
              <RuleBonusRow label="치킨 보너스" on={rule.chickenBonusOn} onToggle={() => setR('chickenBonusOn', !rule.chickenBonusOn)}>
                <NumberStepper val={rule.chickenBonus} min={1} disabled={!rule.chickenBonusOn} onChange={(v) => setR('chickenBonus', v)} />
              </RuleBonusRow>

              <div style={{ borderTop: '1px solid var(--kn-border)', margin: '12px 0' }} />
              <span data-label="" style={{ marginBottom: 10, display: 'block' }}>패널티</span>
              <RuleBonusRow label="조기사망 패널티" on={rule.survivalPenaltyOn} onToggle={() => setR('survivalPenaltyOn', !rule.survivalPenaltyOn)}>
                <NumberStepper val={rule.survivalPenalty} min={1} disabled={!rule.survivalPenaltyOn} onChange={(v) => setR('survivalPenalty', v)} color="var(--kn-danger)" />
              </RuleBonusRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 18 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="primary" onClick={handleRuleSave} loading={ruleSaving} icon="check">저장하기</Button>
              </div>
            </div>
          )}

          {view === 'end' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--kn-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="back" size={14} /> 메뉴로</button>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Icon name="alert" size={32} color="var(--kn-danger)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 15, fontWeight: 'var(--kn-w-bold)', marginBottom: 6 }}>정말 종료하시겠습니까?</div>
                <div style={{ fontSize: 12, color: 'var(--kn-text-muted)', lineHeight: 1.7 }}>종료 시 결과가 확정되고<br />라이브 스코어보드가 닫힙니다.</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', textAlign: 'center', marginBottom: 6 }}>"종료" 를 입력하세요</div>
                <input value={endConfirm} onChange={(e) => setEndConfirm(e.target.value)} placeholder="종료"
                  style={{ width: '100%', textAlign: 'center', background: 'var(--kn-surface-3)', border: `1px solid color-mix(in oklab, var(--kn-danger) 40%, transparent)`, color: 'var(--kn-text)', padding: '10px', borderRadius: 'var(--kn-r-md)', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button variant="danger" disabled={endConfirm !== '종료'} onClick={() => { onEnd(); onClose(); }}>종료하기</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  메인 페이지
// ─────────────────────────────────────────

export default function LivePage() {
  const router = useRouter();
  const { id: roomCode } = useParams();
  const { theme, toggle: toggleTheme } = useTheme();
  const [sessionId, setSessionId] = useState(null);
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [matches, setMatches] = useState([]);
  const [adjs, setAdjs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [modalMatchNum, setModalMatchNum] = useState(1);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [screenshotModal, setScreenshotModal] = useState(null);

  const myTeam = room?.teams?.find((t) => t.leaderUserId === user?.id);
  const hostUserId = room?.hostUserId;
  const isHost = hostUserId === user?.id;

  useEffect(() => {
    if (!roomCode) return;
    RoomAPI.get(roomCode).then(async (roomRes) => {
      if (!roomRes.success) { setLoading(false); return; }
      const session = roomRes.data;
      setSessionId(session.id);
      const teamsRes = await RoomAPI.getTeams(session.id);
      const teams = teamsRes.success ? teamsRes.data.map((t) => ({
        id: t.id, name: t.name, leaderUserId: t.leaderUserId,
        players: (t.players || []).map((nick, idx) => ({ id: idx, nickname: nick })),
      })) : [];
      setRoom({ ...session, rule: mapSessionRule(session), teams });
      setAdjs([]);
      if (session.startedAt) {
        const initialElapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        setElapsed(Math.max(0, initialElapsed));
      }
      const matchRes = await RoomAPI.getMatches(session.id);
      if (matchRes.success) setMatches(matchRes.data?.matches || []);
      setLoading(false);
    });
  }, [roomCode]);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { connected } = useWebSocket(sessionId, (envelope) => {
    if (!envelope) return;
    if (envelope.type === 'SCORE_UPDATED' && sessionId) {
      RoomAPI.getMatches(sessionId).then((matchRes) => {
        if (matchRes.success) setMatches(matchRes.data?.matches || []);
      });
    }
    if (envelope.type === 'ADJUSTMENT_APPLIED' && envelope.data) {
      setAdjs((prev) => [...prev, { teamId: envelope.data.teamId, amount: envelope.data.amount }]);
    }
    if (envelope.type === 'SESSION_ENDED') {
      router.push(`/room/${roomCode}/result`);
    }
  }, !!user && !!sessionId);

  const openTeamModal = useCallback((teamId) => {
    const teamMatchCount = matches.filter((m) => (m.memberResults || []).some((r) => r.teamId === teamId)).length;
    setSelectedTeamId(teamId);
    setModalMatchNum(teamMatchCount + 1);
    setShowTeamModal(true);
    setMatchError('');
  }, [matches]);

  const handleMatchConfirmed = () => { setShowTeamModal(false); setMatchError(''); };

  const handleAdjust = async (teamId, amount, reason) => {
    const res = await RoomAPI.addAdjustment(sessionId, teamId, amount, reason);
    if (res.success) {
      setAdjs((prev) => [...prev, { teamId: parseInt(teamId), amount, reason }]);
    }
  };

  const handleRuleUpdate = async (newRule) => {
    const res = await RoomAPI.updateRule(sessionId, newRule);
    if (res.success) setRoom((prev) => ({ ...prev, rule: res.data.rule || newRule }));
  };

  const handleEnd = async () => {
    const res = await RoomAPI.end(sessionId);
    if (res.success) router.push(`/room/${roomCode}/result`);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-text-muted)' }}>
      <Icon name="spinner" size={20} style={{ animation: 'kn-spin 0.9s linear infinite' }} />
    </div>
  );

  if (!room) return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--kn-danger)' }}>
      <Icon name="alert" size={16} style={{ marginRight: 8 }} /> 방을 찾을 수 없습니다
    </div>
  );

  const { rule, teams } = room;
  const teamScores = [...teams]
    .map((t) => ({ ...t, ...calcTeamScore(t.id, matches, rule, adjs) }))
    .sort((a, b) => b.total - a.total);
  const maxScore = Math.max(1, ...teamScores.map((t) => t.total));
  const timeLimit = rule.noTimeLimit ? null : rule.timeLimitMin * 60;
  const timeLeft  = timeLimit ? Math.max(0, timeLimit - elapsed) : null;

  // ── 경기 종료 조건 체크 ──
  // 목표 킬에 먼저 도달한 팀이 있거나, 제한 시간이 만료되면 종료 안내
  const targetReachedTeam = teamScores.find((t) => t.total >= rule.targetKills);
  const timeOver = timeLeft !== null && timeLeft === 0;
  const gameOver = !!targetReachedTeam || timeOver;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kn-bg)', color: 'var(--kn-text)', display: 'flex', flexDirection: 'column' }}>

      {/* 연결 오류 배너 */}
      {!connected && sessionId && (
        <div style={{
          background: 'color-mix(in oklab, var(--kn-danger) 8%, var(--kn-bg))',
          borderBottom: '1px solid color-mix(in oklab, var(--kn-danger) 30%, transparent)',
          padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--kn-danger)', flexShrink: 0,
        }}>
          <Icon name="alert" size={14} />
          서버와의 연결이 불안정합니다. 점수가 실시간으로 반영되지 않을 수 있습니다.
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: 'var(--kn-surface-1)', borderBottom: '1px solid var(--kn-border)', padding: '0 22px', height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--kn-accent-bg)', border: '1px solid color-mix(in oklab, var(--kn-accent) 20%, transparent)', borderRadius: 'var(--kn-r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="target" size={18} color="var(--kn-accent)" />
          </div>
          <div>
            <div data-label="" style={{ fontSize: 10 }}>LIVE SCOREBOARD</div>
            <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--kn-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--kn-success)', animation: 'kn-pulse 1.4s infinite' }} /> LIVE
              </span>
              <span>{room.title}</span>
              <span>|</span>
              <span>매치 {matches.length}판</span>
              {isHost && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>| 방장</span>}
              {myTeam && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>| {myTeam.name} LEADER</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            title="테마 전환"
            style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', width: 30, height: 30, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          ><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} /></button>
          <button
            onClick={() => setShowRoleGuide(true)}
            title="역할 안내"
            style={{ background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text-muted)', width: 30, height: 30, borderRadius: 'var(--kn-r-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          ><Icon name="info" size={16} /></button>
          <div style={{ background: 'var(--kn-surface-2)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-md)', padding: '7px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--kn-text-muted)', letterSpacing: 1.5, marginBottom: 2 }}>경과 시간</div>
            <div data-mono="" style={{ fontSize: 18, fontWeight: 700 }}>{fmtTime(elapsed)}</div>
          </div>
          {timeLeft !== null && (
            <div style={{ background: 'color-mix(in oklab, var(--kn-danger) 5%, var(--kn-surface-2))', border: '1px solid color-mix(in oklab, var(--kn-danger) 25%, transparent)', borderRadius: 'var(--kn-r-md)', padding: '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--kn-text-muted)', letterSpacing: 1.5, marginBottom: 2 }}>남은 시간</div>
              <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: timeLeft < 300 ? 'var(--kn-danger)' : 'var(--kn-text)' }}>{fmtMMSS(timeLeft)}</div>
            </div>
          )}
        </div>
      </div>

      {/* 경기 종료 조건 배너 */}
      {gameOver && (
        <div style={{
          background: targetReachedTeam ? 'color-mix(in oklab, var(--kn-accent) 10%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 8%, transparent)',
          borderBottom: `1px solid ${targetReachedTeam ? 'color-mix(in oklab, var(--kn-accent) 35%, transparent)' : 'color-mix(in oklab, var(--kn-danger) 30%, transparent)'}`,
          padding: '12px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={targetReachedTeam ? 'trophy' : 'clock'} size={22} color={targetReachedTeam ? 'var(--kn-accent)' : 'var(--kn-danger)'} />
            <div>
              {targetReachedTeam ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-accent)' }}>{targetReachedTeam.name} — 목표 킬 {rule.targetKills}킬 달성!</div>
                  <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>경기를 종료하고 최종 결과를 확정하세요</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 'var(--kn-w-bold)', color: 'var(--kn-danger)' }}>제한 시간 종료!</div>
                  <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', marginTop: 2 }}>경기를 종료해주세요</div>
                </>
              )}
            </div>
          </div>
          {isHost && <Button variant="danger" onClick={handleEnd} icon="flag">경기 종료</Button>}
        </div>
      )}

      {/* 본문 */}
      <div style={{ flex: 1, padding: '16px 22px', overflowY: 'auto' }}>

        {/* 팀별 점수 카드 */}
        <section style={{ marginBottom: 20 }}>
          <span data-label="" style={{ marginBottom: 10, display: 'block' }}>팀 현황</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teamScores.length, 4)}, 1fr)`, gap: 12 }}>
            {teamScores.map((t, idx) => {
              const isFirst = idx === 0;
              const safeTarget = rule.targetKills > 0 ? rule.targetKills : 1;
              const progress = Math.min(100, Math.round((t.total / safeTarget) * 100));
              const isTargetDone = t.total >= rule.targetKills;
              return (
                <div key={t.id} style={{
                  background: 'var(--kn-surface-1)',
                  border: `1px solid ${isTargetDone ? 'color-mix(in oklab, var(--kn-accent) 60%, transparent)' : isFirst ? 'color-mix(in oklab, var(--kn-accent) 40%, transparent)' : 'var(--kn-border)'}`,
                  borderRadius: 'var(--kn-r-lg)', padding: '14px 16px',
                  boxShadow: isTargetDone ? '0 0 16px color-mix(in oklab, var(--kn-accent) 15%, transparent)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: isTargetDone ? 'var(--kn-accent)' : 'var(--kn-text-muted)', letterSpacing: 1.5, fontWeight: isTargetDone ? 700 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isTargetDone ? <><Icon name="trophy" size={12} /> WINNER</> : `RANK #${idx + 1}`}
                    </div>
                    <div data-display="" style={{ fontSize: 36, color: isFirst ? 'var(--kn-accent)' : 'var(--kn-text)', fontFamily: 'var(--kn-font-mono)' }}>{t.total}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 'var(--kn-w-bold)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', marginBottom: 8 }}>
                    목표: {rule.targetKills}킬 &nbsp;
                    <span style={{ color: isTargetDone ? 'var(--kn-success)' : 'var(--kn-text-muted)', fontWeight: isTargetDone ? 700 : 400 }}>
                      {t.kills}/{rule.targetKills}킬 {isTargetDone ? '달성' : `(${Math.round(progress)}%)`}
                    </span>
                  </div>
                  {/* 프로그레스바 */}
                  <div style={{ background: 'var(--kn-surface-3)', borderRadius: 2, height: 5, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: isTargetDone ? 'var(--kn-success)' : isFirst ? 'var(--kn-accent)' : 'var(--kn-text-muted)', width: `${progress}%`, transition: 'width .4s' }} />
                  </div>
                  {/* 킬/보너스/패널티 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, gap: 2 }}>
                    {[
                      { label: '킬', val: t.kills, color: 'var(--kn-text)' },
                      { label: '보너스', val: `+${t.bonus}`, color: 'var(--kn-success)' },
                      { label: '패널티', val: `-${t.penalty}`, color: 'var(--kn-danger)' },
                    ].map((s) => (
                      <div key={s.label}>
                        <div style={{ color: 'var(--kn-text-muted)' }}>{s.label}</div>
                        <div style={{ fontWeight: 700, color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {t.adj !== 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: t.adj > 0 ? 'var(--kn-success)' : 'var(--kn-danger)' }}>
                      조정: {t.adj > 0 ? '+' : ''}{t.adj}
                    </div>
                  )}

                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--kn-border)' }}>
                    {(() => {
                      const teamMatchCount = matches.filter((m) => (m.memberResults || []).some((r) => r.teamId === t.id)).length;
                      return (
                        <div style={{ fontSize: 10, color: 'var(--kn-text-muted)', textAlign: 'center', marginBottom: myTeam?.id === t.id ? 6 : 0 }}>
                          {teamMatchCount > 0 ? `${teamMatchCount}게임 완료` : '아직 결과 없음'}
                        </div>
                      );
                    })()}
                    {myTeam?.id === t.id && (
                      <Button variant="accent" fullWidth onClick={() => openTeamModal(t.id)} icon="edit" style={{ fontSize: 12 }}>
                        결과 입력
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

          {/* 개인별 통계 */}
          <section>
            <span data-label="" style={{ marginBottom: 10, display: 'block' }}>개인 통계</span>
            <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', overflow: 'hidden' }}>
              {teams.map((team, tIdx) => {
                const stats = (team.players || []).map((p) => { const nick = typeof p === 'string' ? p : p.nickname; return { nick, ...calcPlayerStats(nick, matches, rule) }; })
                  .sort((a, b) => b.kills - a.kills);
                return (
                  <div key={team.id}>
                    <div style={{ background: 'var(--kn-surface-2)', borderLeft: '3px solid var(--kn-accent)', padding: '8px 14px', fontSize: 12, fontWeight: 'var(--kn-w-bold)', borderTop: tIdx > 0 ? '1px solid var(--kn-border)' : 'none' }}>
                      {team.name}
                    </div>
                    {stats.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--kn-text-dim)' }}>플레이어 없음</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--kn-border)' }}>
                            {['닉네임', '킬', '보너스', '패널티', '총점'].map((h) => (
                              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: 'var(--kn-text-muted)', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((p) => (
                            <tr key={p.nick} style={{ borderBottom: '1px solid var(--kn-border)' }}>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.nick}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.kills}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--kn-success)' }}>{p.bonus > 0 ? `+${p.bonus}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: p.penalty > 0 ? 'var(--kn-danger)' : 'var(--kn-text-dim)' }}>{p.penalty > 0 ? `-${p.penalty}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 17, fontWeight: 700, color: 'var(--kn-accent)' }}>{p.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 매치 히스토리 */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span data-label="">매치 히스토리</span>
              {matches.length > 30 && <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{matches.length}게임 중 최근 30개</span>}
            </div>
            <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
              {matches.length === 0 ? (
                <div style={{ color: 'var(--kn-text-dim)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>아직 결과 없음</div>
              ) : (
                [...matches].reverse().slice(0, 30).map((m) => {
                  const results = m.memberResults || [];
                  const totalKills = results.reduce((s, r) => s + r.kills, 0);
                  const hasChicken = results.some((r) => r.isChicken);
                  const hasShot = !!m.screenshotUrl;
                  return (
                    <div
                      key={m.matchId}
                      onClick={() => hasShot && setScreenshotModal({ url: m.screenshotUrl, match: m })}
                      style={{ padding: '9px 0', borderBottom: '1px solid var(--kn-border)', cursor: hasShot ? 'pointer' : 'default', borderRadius: 'var(--kn-r-sm)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kn-accent)' }}>매치 #{m.matchNumber}</span>
                          {hasChicken && <Icon name="trophy" size={10} color="var(--kn-accent)" />}
                          {hasShot && <Icon name="image" size={10} color="var(--kn-text-muted)" />}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>{m.playedAt ? new Date(m.playedAt).toLocaleTimeString('ko') : ''}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>
                        킬: <b style={{ color: 'var(--kn-text)' }}>{totalKills}</b>
                        {results.map((r) => (
                          <span key={r.playerId} style={{ marginLeft: 6 }}>{r.playerNickname} {r.kills}킬</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {adjs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span data-label="" style={{ marginBottom: 8, display: 'block' }}>점수 조정 내역</span>
                <div style={{ background: 'var(--kn-surface-1)', border: '1px solid var(--kn-border)', borderRadius: 'var(--kn-r-lg)', padding: '10px 14px' }}>
                  {adjs.map((a, i) => {
                    const team = teams.find((t) => t.id === a.teamId);
                    return (
                      <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--kn-border)', fontSize: 11 }}>
                        <span style={{ color: 'var(--kn-text-muted)' }}>{team?.name}</span>
                        <span style={{ marginLeft: 8, color: a.amount > 0 ? 'var(--kn-success)' : 'var(--kn-danger)', fontWeight: 700 }}>
                          {a.amount > 0 ? '+' : ''}{a.amount}
                        </span>
                        <div style={{ color: 'var(--kn-text-dim)', marginTop: 2 }}>{a.reason}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 하단 바 */}
      <div style={{ background: 'var(--kn-surface-1)', borderTop: '1px solid var(--kn-border)', padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12 }}>
          {gameOver ? (
            <span style={{ color: targetReachedTeam ? 'var(--kn-accent)' : 'var(--kn-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={targetReachedTeam ? 'trophy' : 'clock'} size={14} />
              {targetReachedTeam ? `${targetReachedTeam.name} 목표 킬 달성` : '시간 종료'} — 경기를 종료해주세요
            </span>
          ) : (
            <span style={{ color: 'var(--kn-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isHost && <span style={{ color: 'var(--kn-accent)', fontWeight: 700 }}>방장</span>}
              {myTeam ? `${myTeam.name} LEADER` : '관전자'} —&nbsp;
              {myTeam
                ? '게임이 끝날 때마다 내 팀 카드의 [결과 입력]으로 결과를 제출하세요'
                : '각 팀 LEADER가 게임 결과를 입력합니다'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {matchError && (
            <span style={{ fontSize: 11, color: 'var(--kn-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="alert" size={13} /> {matchError}
            </span>
          )}
          {isHost && (
            <Button variant="ghost" onClick={() => setShowAdminModal(true)} icon="settings">운영 메뉴</Button>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showTeamModal && selectedTeamId && (
        <TeamResultModal room={room} teamId={selectedTeamId} matchNumber={modalMatchNum} sessionId={sessionId} onConfirmed={handleMatchConfirmed} onClose={() => setShowTeamModal(false)} />
      )}
      {showAdminModal && (
        <AdminModal room={room} onAdjust={handleAdjust} onEnd={handleEnd} onRuleUpdate={handleRuleUpdate} onClose={() => setShowAdminModal(false)} />
      )}
      {screenshotModal && (
        <ScreenshotModal info={screenshotModal} onClose={() => setScreenshotModal(null)} />
      )}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}
