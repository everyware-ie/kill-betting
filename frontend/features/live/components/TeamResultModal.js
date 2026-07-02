'use client';

import { useState, useEffect } from 'react';
import { RoomAPI } from '@/lib/room-api';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ToggleMini from './ToggleMini';

const btnStyle = {
  width: 24, height: 26,
  background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)',
  color: 'var(--kn-accent)', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
};

export default function TeamResultModal({ room, teamId, matchNumber, sessionId, onConfirmed, onClose }) {
  const { teams, rule } = room;
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const [results, setResults] = useState(
    (team.players || []).map((p) => ({
      nick: typeof p === 'string' ? p : p.nickname, teamId,
      kills: 0, damage: 0, assists: 0, isTop10: false,
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

  useEffect(() => {
    const handlePaste = (e) => {
      const file = Array.from(e.clipboardData?.items || [])
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (file) handleFileChange(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrLoading(true); setOcrError(''); setOcrProgress(0);
    const progressTimer = setInterval(() => {
      setOcrProgress((prev) => (prev < 90 ? prev + Math.random() * 15 : prev));
    }, 400);
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
      setOcrUnmatched(stats.filter((p) => !teamNicks.has(p.nickname?.toLowerCase())).map((p, i) => ({ ...p, _id: i })));
    }
    setOcrDone(true);
  };

  const handleOcrMapping = (ocrId, teamNick) => {
    if (!teamNick) return;
    const ocrItem = ocrUnmatched.find((u) => u._id === ocrId);
    if (!ocrItem) return;
    setResults((prev) => prev.map((r) =>
      r.nick === teamNick ? { ...r, kills: ocrItem.kills ?? r.kills, damage: ocrItem.damage ?? r.damage } : r
    ));
    setOcrUnmatched((prev) => prev.filter((u) => u._id !== ocrId));
    setOcrFilledNicks((prev) => new Set([...prev, teamNick]));
  };

  const unmappedTeamNicks = results.filter((r) => !ocrFilledNicks.has(r.nick)).map((r) => r.nick);

  const previewKills = results.reduce((s, r) => s + r.kills, 0);
  const previewBonus = claimsChicken && rule.chickenBonusOn ? rule.chickenBonus : 0;
  const previewPenalty = rule.survivalPenaltyOn ? results.filter((r) => !r.isTop10).length * rule.survivalPenalty : 0;
  const previewTotal = previewKills + previewBonus - previewPenalty;

  const handleSubmit = async () => {
    if (!matchId) { setOcrError('먼저 스크린샷을 업로드하고 분석을 완료해주세요'); return; }
    setSubmitting(true);
    const playerResults = results.map((r) => ({
      nickname: r.nick, kills: r.kills, damage: r.damage || 0, assists: r.assists || 0, isTop10: r.isTop10 || false,
    }));
    const confirmRes = await RoomAPI.confirmMatch(matchId, {
      playerResults, isChicken: claimsChicken, mapName: ocrMapName, placement: ocrPlacement, playTime: ocrPlayTime,
    });
    setSubmitting(false);
    if (!confirmRes.success) { setOcrError(confirmRes.error || '매치 확정에 실패했습니다'); return; }
    onConfirmed?.();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'var(--kn-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 16 }}
    >
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

          {/* OCR 업로드 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--kn-text-muted)', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="image" size={14} /> 스크린샷 OCR 자동 입력
              <span style={{ fontSize: 10, color: 'var(--kn-text-dim)' }}>(선택 사항)</span>
            </div>
            <div
              onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('ocr-file-input').click()}
              style={{ border: `2px dashed ${ocrFile ? 'color-mix(in oklab, var(--kn-accent) 50%, transparent)' : 'var(--kn-border)'}`, borderRadius: 'var(--kn-r-lg)', padding: '14px 16px', background: ocrFile ? 'color-mix(in oklab, var(--kn-accent) 5%, transparent)' : 'var(--kn-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .2s' }}
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
                    <div style={{ fontSize: 11, color: 'var(--kn-text-dim)', marginTop: 2 }}>jpg, png 등 이미지 파일 · Ctrl+V로 붙여넣기 가능</div>
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

            {/* 미매칭 OCR 수동 매핑 */}
            {ocrDone && ocrUnmatched.length > 0 && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'color-mix(in oklab, var(--kn-accent) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--kn-accent) 25%, transparent)', borderRadius: 'var(--kn-r-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--kn-accent)', fontWeight: 600, marginBottom: 8 }}>
                  닉네임 미매칭 {ocrUnmatched.length}건 — 팀원을 선택해 연결하세요
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ocrUnmatched.map((u) => (
                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: 'var(--kn-surface-1)', borderRadius: 'var(--kn-r-md)', border: '1px solid var(--kn-border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kn-text)', minWidth: 80 }}>"{u.nickname}"</span>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>킬 {u.kills ?? 0}</span>
                      <span style={{ fontSize: 11, color: 'var(--kn-text-muted)' }}>데미지 {u.damage ?? 0}</span>
                      <Icon name="arrow-right" size={12} color="var(--kn-text-dim)" />
                      <select
                        defaultValue=""
                        onChange={(e) => { handleOcrMapping(u._id, e.target.value); e.target.value = ''; }}
                        style={{ flex: 1, background: 'var(--kn-surface-3)', border: '1px solid color-mix(in oklab, var(--kn-accent) 30%, transparent)', color: 'var(--kn-text)', padding: '5px 8px', borderRadius: 'var(--kn-r-md)', fontSize: 12, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="">팀원 선택...</option>
                        {unmappedTeamNicks.map((nick) => <option key={nick} value={nick}>{nick}</option>)}
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
                          onChange={(e) => setR(r.nick, 'damage', parseInt(e.target.value) || 0)}
                          style={{ width: 70, background: 'var(--kn-surface-3)', border: '1px solid var(--kn-border-strong)', color: 'var(--kn-text)', padding: '4px 8px', borderRadius: 'var(--kn-r-md)', fontSize: 12, outline: 'none', fontFamily: 'var(--kn-font-mono)', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => setR(r.nick, 'assists', Math.max(0, (r.assists || 0) - 1))} style={btnStyle}>−</button>
                          <span style={{ width: 32, textAlign: 'center', lineHeight: '26px', background: 'var(--kn-surface-3)', borderTop: '1px solid var(--kn-border-strong)', borderBottom: '1px solid var(--kn-border-strong)', fontWeight: 700, color: 'var(--kn-accent)', fontFamily: 'var(--kn-font-mono)' }}>{r.assists || 0}</span>
                          <button onClick={() => setR(r.nick, 'assists', (r.assists || 0) + 1)} style={btnStyle}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <ToggleMini on={r.isTop10} onChange={() => setR(r.nick, 'isTop10', !r.isTop10)} />
                      </td>
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
