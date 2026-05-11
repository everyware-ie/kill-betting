/**
 * ============================================================
 *  라이브 스코어보드  /room/:id/live
 * ============================================================
 *
 *  [화면 구성]
 *   - 헤더: 방 제목, 경과 타이머, 남은 시간
 *   - 팀별 점수 카드 (순위, 총점, 프로그레스바, 킬/보너스/패널티)
 *   - 개인별 통계 테이블
 *   - 매치 히스토리 로그
 *   - 하단: [매치 결과 입력] [운영 메뉴]
 *
 *  [LEADER 전용]
 *   - 매치 결과 입력 모달 열기
 *   - 운영 메뉴 (점수 조정, 경기 종료)
 *
 *  [점수 계산]
 *   팀 총점 = 킬 합계 + 보너스 합계 - 패널티 합계 + 수동 조정값
 *
 *  [API 호출]
 *   RoomAPI.get(roomId)         — 방/팀/룰 정보
 *   RoomAPI.getMatches(roomId)  — 매치 목록 (폴링 방식, 5초)
 *   RoomAPI.addMatch(...)       — 매치 결과 저장
 *   RoomAPI.addAdjustment(...)  — 점수 수동 조정
 *   RoomAPI.end(roomId)         — 킬내기 종료
 *
 * ============================================================
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth }  from '@/lib/auth-context';
import { RoomAPI }  from '@/lib/room-api';
import { OcrAPI }  from '@/lib/ocr-api';
import Button from '@/components/ui/Button';
import RoleGuideModal from '@/components/ui/RoleGuideModal';

// ─────────────────────────────────────────
//  점수 계산 유틸
// ─────────────────────────────────────────

/**
 * 팀 총점 계산
 *
 * 각 팀은 독립적으로 매치를 제출하므로 match.teamId === teamId 인 것만 합산
 */
function calcTeamScore(teamId, matches, rule, adjustments = []) {
  let kills = 0, bonus = 0, penalty = 0;

  // 이 팀이 제출한 매치만 필터링
  const teamMatches = matches.filter((m) => m.teamId === teamId);

  for (const m of teamMatches) {
    // 치킨 보너스 (자신의 게임에서 치킨을 먹었는지)
    if (rule.chickenBonusOn && m.chickenTeamId === teamId) bonus += rule.chickenBonus;

    for (const r of m.results) {
      kills += r.kills;
      if (rule.headShotBonusOn  && r.headShot)   bonus   += rule.headShotBonus;
      if (rule.assistBonusOn    && r.assist)      bonus   += rule.assistBonus;
      if (rule.teamKillPenaltyOn)                 penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn   && r.earlyDeath)  penalty += rule.deathPenalty;
    }
  }

  const adj = adjustments
    .filter((a) => a.teamId === teamId)
    .reduce((s, a) => s + a.amount, 0);

  return { kills, bonus, penalty, adj, total: kills + bonus - penalty + adj };
}

/** 개인 통계 계산 (전체 매치에서 해당 닉네임의 결과를 모두 합산) */
function calcPlayerStats(nick, matches, rule) {
  let kills = 0, bonus = 0, penalty = 0, damage = 0;
  for (const m of matches) {
    for (const r of m.results) {
      if (r.nick !== nick) continue;
      kills  += r.kills;
      damage += r.damage || 0;
      if (rule.headShotBonusOn  && r.headShot)   bonus   += rule.headShotBonus;
      if (rule.assistBonusOn    && r.assist)      bonus   += rule.assistBonus;
      if (rule.teamKillPenaltyOn)                 penalty += (r.teamKills || 0) * rule.teamKillPenalty;
      if (rule.deathPenaltyOn   && r.earlyDeath)  penalty += rule.deathPenalty;
    }
  }
  return { kills, bonus, penalty, damage, total: kills + bonus - penalty };
}

/** 초 → HH:MM:SS */
const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
};

/** 초 → MM:SS */
const fmtMMSS = (s) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
};

// ─────────────────────────────────────────
//  팀별 매치 결과 입력 모달
// ─────────────────────────────────────────

/**
 * TeamResultModal
 *
 * 로그인한 사용자가 속한 팀의 플레이어 결과만 입력합니다.
 * - teamId: 입력할 팀 ID
 * - onSubmit(results, claimsChicken): 제출 콜백
 */
function TeamResultModal({ room, teamId, matchNumber, onSubmit, onClose }) {
  const { teams, rule } = room;

  // 이 모달에서 입력할 팀 정보
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  // 이 팀 플레이어만 초기화 (다른 팀 플레이어는 표시하지 않음)
  const [results, setResults] = useState(
    team.players.map((nick) => ({
      nick, teamId,
      kills: 0, damage: 0,
      headShot: false, assist: false, teamKills: 0, earlyDeath: false,
    }))
  );
  // 치킨 여부 — "이 팀이 치킨을 먹었나요?" (팀 선택 없이 단순 토글)
  const [claimsChicken, setClaimsChicken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── OCR 관련 상태 ──
  const [ocrFile,      setOcrFile]      = useState(null);       // 선택된 이미지 파일
  const [ocrPreview,   setOcrPreview]   = useState(null);       // 이미지 미리보기 URL
  const [ocrLoading,   setOcrLoading]   = useState(false);      // OCR 처리 중 여부
  const [ocrError,     setOcrError]     = useState('');         // OCR 오류 메시지
  const [ocrDone,      setOcrDone]      = useState(false);      // OCR 완료 여부
  const [ocrIsMock,    setOcrIsMock]    = useState(false);      // Mock 결과 여부
  const [ocrUnmatched, setOcrUnmatched] = useState([]);         // 매칭 안 된 닉네임
  // OCR로 채워진 필드를 하이라이트하기 위한 닉네임 세트
  const [ocrFilledNicks, setOcrFilledNicks] = useState(new Set());

  const setR = (nick, key, val) =>
    setResults((prev) => prev.map((r) => r.nick === nick ? { ...r, [key]: val } : r));

  // ── 이미지 파일 선택 처리 ──
  const handleFileChange = (file) => {
    if (!file) return;
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      setOcrError('이미지 파일만 업로드 가능합니다 (jpg, png 등)');
      return;
    }
    setOcrFile(file);
    setOcrError('');
    setOcrDone(false);
    setOcrFilledNicks(new Set());
    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setOcrPreview(url);
  };

  // ── 드래그 앤 드롭 처리 ──
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  // ── OCR 분석 실행 ──
  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrError('');

    // 이 팀의 닉네임만 힌트로 전달 (팀별 입력이므로)
    const teamNicks = team.players;
    const res = await OcrAPI.parseScreenshot(ocrFile, teamNicks);

    setOcrLoading(false);

    if (!res.success) {
      setOcrError(res.error || 'OCR 처리에 실패했습니다');
      return;
    }

    // OCR 결과를 results 테이블에 자동으로 채우기
    // res.players 배열의 nick 으로 매칭하여 해당 행만 업데이트
    const filled = new Set();
    setResults((prev) => prev.map((row) => {
      const matched = res.data.players.find(
        // 대소문자 무시하고 닉네임 매칭
        (p) => p.nick.toLowerCase() === row.nick.toLowerCase()
      );
      if (!matched) return row; // 매칭 안 되면 기존 값 유지
      filled.add(row.nick);
      return {
        ...row,
        kills:      matched.kills      ?? row.kills,
        damage:     matched.damage     ?? row.damage,
        headShot:   matched.headShot   ?? row.headShot,
        assist:     matched.assist     ?? row.assist,
        teamKills:  matched.teamKills  ?? row.teamKills,
        earlyDeath: matched.earlyDeath ?? row.earlyDeath,
      };
    }));

    setOcrFilledNicks(filled);
    setOcrUnmatched(res.unmatched || []);
    setOcrIsMock(res.isMock || false);
    setOcrDone(true);
  };

  // 이번 매치 이 팀의 점수 미리보기
  const previewKills   = results.reduce((s, r) => s + r.kills, 0);
  const previewBonus   = results.reduce((s, r) =>
    s + (rule.headShotBonusOn && r.headShot ? rule.headShotBonus : 0)
      + (rule.assistBonusOn   && r.assist   ? rule.assistBonus   : 0), 0)
    + (claimsChicken && rule.chickenBonusOn ? rule.chickenBonus : 0);
  const previewPenalty = results.reduce((s, r) =>
    s + (rule.teamKillPenaltyOn ? (r.teamKills || 0) * rule.teamKillPenalty : 0)
      + (rule.deathPenaltyOn && r.earlyDeath ? rule.deathPenalty : 0), 0);
  const previewTotal   = previewKills + previewBonus - previewPenalty;

  const handleSubmit = async () => {
    setSubmitting(true);
    // onSubmit(results 배열, 치킨 여부, 스크린샷 파일) — 팀 ID는 부모에서 이미 알고 있음
    // ocrFile이 있으면 제출 후 S3에 업로드됨
    await onSubmit(results, claimsChicken, ocrFile || null);
    setSubmitting(false);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 16 }}>
      <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.28)', borderRadius: 10, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* 헤더 */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(200,155,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {team.name} — {matchNumber}번째 게임 결과 입력
            </div>
            <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>
              우리 팀({team.players.length}명) 결과만 입력합니다 · 스크린샷 OCR 또는 직접 입력
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#2a2810', border: '1px solid rgba(200,155,0,0.2)', color: '#E8DFC0', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px' }}>

          {/* ── OCR 스크린샷 업로드 영역 ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              📷 스크린샷 OCR 자동 입력
              <span style={{ fontSize: 10, color: '#555' }}>(선택 사항 — 결과 화면 캡처 업로드)</span>
            </div>

            {/* 드래그 앤 드롭 / 클릭 업로드 영역 */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('ocr-file-input').click()}
              style={{
                border: `2px dashed ${ocrFile ? 'rgba(245,166,35,0.5)' : 'rgba(200,155,0,0.2)'}`,
                borderRadius: 8, padding: '14px 16px',
                background: ocrFile ? 'rgba(245,166,35,0.05)' : '#141200',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color .2s',
              }}
            >
              {/* 숨겨진 파일 input */}
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files[0])}
              />

              {/* 이미지 미리보기 or 업로드 안내 */}
              {ocrPreview ? (
                <img
                  src={ocrPreview}
                  alt="스크린샷 미리보기"
                  style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(200,155,0,0.2)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 80, height: 50, background: 'rgba(200,155,0,0.06)', borderRadius: 4, border: '1px solid rgba(200,155,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  🖼
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {ocrFile ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ocrFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>
                      {(ocrFile.size / 1024).toFixed(0)} KB · 클릭하여 다시 선택
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: '#8A8060' }}>클릭하거나 파일을 여기에 드래그하세요</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>jpg, png 등 이미지 파일</div>
                  </div>
                )}
              </div>

              {/* OCR 분석 버튼 */}
              {ocrFile && !ocrLoading && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleOcr(); }}
                  style={{ background: '#F5A623', color: '#1a1500', border: 'none', borderRadius: 4, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  분석
                </button>
              )}

              {/* OCR 로딩 중 */}
              {ocrLoading && (
                <div style={{ fontSize: 12, color: '#F5A623', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(245,166,35,0.3)', borderTopColor: '#F5A623', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  분석 중...
                </div>
              )}
            </div>

            {/* OCR 완료 메시지 */}
            {ocrDone && !ocrError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 4, fontSize: 11, color: '#4CAF50', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>✓ OCR 완료 — {ocrFilledNicks.size}명 자동 입력됨</span>
                {ocrIsMock && <span style={{ color: '#8A8060' }}>[MOCK 데이터]</span>}
                {ocrUnmatched.length > 0 && (
                  <span style={{ color: '#F5A623' }}>미매칭: {ocrUnmatched.join(', ')}</span>
                )}
                <span style={{ color: '#8A8060' }}>아래에서 수치를 직접 수정할 수 있습니다</span>
              </div>
            )}

            {/* OCR 오류 메시지 */}
            {ocrError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 4, fontSize: 11, color: '#E53935' }}>
                ⚠ {ocrError}
              </div>
            )}
          </div>

          {/* 치킨 여부 — "우리 팀이 치킨을 먹었나요?" */}
          <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🍗</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>우리 팀({team.name})이 치킨을 먹었나요?</span>
            <div onClick={() => setClaimsChicken((v) => !v)} style={{ width: 40, height: 22, borderRadius: 11, background: claimsChicken ? '#F5A623' : '#2a2810', border: '1px solid rgba(200,155,0,0.25)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: claimsChicken ? 19 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
            </div>
            {claimsChicken && rule.chickenBonusOn && (
              <span style={{ fontSize: 12, color: '#F5A623' }}>+{rule.chickenBonus} 보너스 적용됩니다</span>
            )}
          </div>

          {/* 플레이어별 입력 — 이 팀 플레이어만 표시 */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(200,155,0,0.15)' }}>
                  {['닉네임', '킬', '데미지', '헤드샷', '어시스트', '팀킬', '일찍사망'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#8A8060', fontWeight: 600, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isOcrFilled = ocrFilledNicks.has(r.nick);
                  return (
                    <tr key={r.nick} style={{ borderBottom: '1px solid rgba(200,155,0,0.06)', background: isOcrFilled ? 'rgba(245,166,35,0.04)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        {isOcrFilled && <span style={{ fontSize: 9, color: '#F5A623', marginRight: 4, verticalAlign: 'middle' }}>OCR</span>}
                        {r.nick}
                      </td>
                      {/* 킬 */}
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => setR(r.nick, 'kills', Math.max(0, r.kills - 1))} style={btnStyle}>−</button>
                          <span style={{ width: 32, textAlign: 'center', lineHeight: '26px', background: '#141200', borderTop: '1px solid rgba(200,155,0,0.2)', borderBottom: '1px solid rgba(200,155,0,0.2)', fontWeight: 700, color: '#F5A623' }}>{r.kills}</span>
                          <button onClick={() => setR(r.nick, 'kills', r.kills + 1)} style={btnStyle}>+</button>
                        </div>
                      </td>
                      {/* 데미지 */}
                      <td style={{ padding: '6px 10px' }}>
                        <input type="number" value={r.damage} min={0}
                          onChange={(e) => setR(r.nick, 'damage', parseInt(e.target.value)||0)}
                          style={{ width: 70, background: '#141200', border: '1px solid rgba(200,155,0,0.2)', color: '#E8DFC0', padding: '4px 8px', borderRadius: 4, fontSize: 12, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
                      </td>
                      {/* 헤드샷 */}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <ToggleMini on={r.headShot} onChange={() => setR(r.nick, 'headShot', !r.headShot)} />
                      </td>
                      {/* 어시스트 */}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <ToggleMini on={r.assist} onChange={() => setR(r.nick, 'assist', !r.assist)} />
                      </td>
                      {/* 팀킬 */}
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex' }}>
                          <button onClick={() => setR(r.nick, 'teamKills', Math.max(0, (r.teamKills||0) - 1))} style={btnStyle}>−</button>
                          <span style={{ width: 28, textAlign: 'center', lineHeight: '26px', background: '#141200', borderTop: '1px solid rgba(200,155,0,0.2)', borderBottom: '1px solid rgba(200,155,0,0.2)', fontWeight: 700, color: '#E53935' }}>{r.teamKills||0}</span>
                          <button onClick={() => setR(r.nick, 'teamKills', (r.teamKills||0) + 1)} style={btnStyle}>+</button>
                        </div>
                      </td>
                      {/* 일찍사망 */}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <ToggleMini on={r.earlyDeath} onChange={() => setR(r.nick, 'earlyDeath', !r.earlyDeath)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 이번 매치 우리 팀 점수 미리보기 */}
          <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.12)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 1, marginBottom: 8 }}>이번 매치 {team.name} 점수 미리보기</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 10, color: '#8A8060', marginBottom: 2 }}>총점</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#F5A623', lineHeight: 1 }}>{previewTotal}</div>
              </div>
              <div style={{ fontSize: 12, color: '#8A8060', paddingBottom: 4 }}>
                킬 <b style={{ color: '#E8DFC0' }}>{previewKills}</b>
                &nbsp;+<b style={{ color: '#F5A623' }}>{previewBonus}</b>
                &nbsp;-<b style={{ color: '#E53935' }}>{previewPenalty}</b>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={handleSubmit} loading={submitting}>✓ 우리 팀 결과 제출</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  스크린샷 뷰어 모달
// ─────────────────────────────────────────

/**
 * ScreenshotModal
 *
 * 매치 히스토리 항목 클릭 시 열리는 이미지 뷰어
 * info: { url, match, team }
 */
function ScreenshotModal({ info, onClose }) {
  const { url, match, team } = info;
  const totalKills = (match.results || []).reduce((s, r) => s + r.kills, 0);
  const hasChicken = match.chickenTeamId === match.teamId;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 상단 정보 바 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F5A623' }}>
              {team?.name ?? '?'} — {match.teamMatchNumber}번째 게임
            </span>
            {hasChicken && <span style={{ fontSize: 14 }}>🍗 치킨</span>}
            <span style={{ fontSize: 12, color: '#8A8060' }}>킬 {totalKills}</span>
            <span style={{ fontSize: 11, color: '#555' }}>
              {new Date(match.createdAt).toLocaleString('ko')}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(200,155,0,0.1)', border: '1px solid rgba(200,155,0,0.25)',
              color: '#E8DFC0', padding: '6px 14px', borderRadius: 4,
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}
          >
            ✕ 닫기
          </button>
        </div>

        {/* 이미지 */}
        <img
          src={url}
          alt={`${team?.name} ${match.teamMatchNumber}번째 게임 결과`}
          style={{
            width: '100%', maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: 6,
            border: '1px solid rgba(200,155,0,0.2)',
          }}
        />

        {/* 하단 안내 */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#555' }}>
          화면 바깥 클릭 또는 [닫기] 버튼으로 닫습니다
        </div>
      </div>
    </div>
  );
}

// ── 작은 토글 ──
const ToggleMini = ({ on, onChange }) => (
  <div onClick={onChange} style={{ width: 34, height: 18, borderRadius: 9, background: on ? '#F5A623' : '#2a2810', border: '1px solid rgba(200,155,0,0.2)', cursor: 'pointer', position: 'relative', display: 'inline-block', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 1, left: on ? 16 : 1, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left .15s' }} />
  </div>
);

// ── 작은 버튼 스타일 ──
const btnStyle = { width: 24, height: 26, background: '#141200', border: '1px solid rgba(200,155,0,0.2)', color: '#F5A623', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' };

// ── 룰 변경 뷰 헬퍼 컴포넌트들 ──

/** 룰 항목 한 행 (레이블 + 설명 + 오른쪽 컨트롤) */
const RuleRow = ({ label, desc, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(200,155,0,0.07)', gap: 12 }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#8A8060', marginTop: 1 }}>{desc}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

/** 보너스/패널티 행 (토글 + 값 스테퍼) */
const RuleBonusRow = ({ label, on, onToggle, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(200,155,0,0.07)', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <ToggleMini on={on} onChange={onToggle} />
      <span style={{ fontSize: 13, fontWeight: 600, color: on ? '#E8DFC0' : '#555' }}>{label}</span>
    </div>
    <div style={{ flexShrink: 0, opacity: on ? 1 : 0.3, pointerEvents: on ? 'auto' : 'none' }}>{children}</div>
  </div>
);

/** 숫자 스테퍼 (− 값 +) */
const NumberStepper = ({ val, min = 0, max = 99, onChange, color = '#F5A623', disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <button onClick={() => onChange(Math.max(min, val - 1))} disabled={disabled}
      style={{ width: 24, height: 26, background: '#141200', border: '1px solid rgba(200,155,0,0.2)', color: '#8A8060', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: '3px 0 0 3px' }}>−</button>
    <span style={{ width: 36, textAlign: 'center', lineHeight: '26px', background: '#141200', borderTop: '1px solid rgba(200,155,0,0.2)', borderBottom: '1px solid rgba(200,155,0,0.2)', fontWeight: 700, color, fontSize: 15 }}>{val}</span>
    <button onClick={() => onChange(Math.min(max, val + 1))} disabled={disabled}
      style={{ width: 24, height: 26, background: '#141200', border: '1px solid rgba(200,155,0,0.2)', color: '#8A8060', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: '0 3px 3px 0' }}>+</button>
  </div>
);

/** 룰 변경 뷰 스테퍼용 버튼 스타일 */
const rBtnStyle = { width: 26, height: 28, background: '#141200', border: '1px solid rgba(200,155,0,0.2)', color: '#8A8060', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', borderRadius: 3 };

// ─────────────────────────────────────────
//  운영 메뉴 모달
// ─────────────────────────────────────────

function AdminModal({ room, onAdjust, onEnd, onRuleUpdate, onClose }) {
  const [view, setView] = useState('menu'); // 'menu' | 'adjust' | 'rule' | 'end'
  const [adjTeamId, setAdjTeamId] = useState(room.teams[0]?.id || '');
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjSign,   setAdjSign]   = useState('+');
  const [adjReason, setAdjReason] = useState('');
  const [endConfirm, setEndConfirm] = useState('');

  // ── 룰 변경 상태 (현재 룰을 초기값으로) ──
  const [rule, setRule] = useState({ ...room.rule });
  const [ruleSaving, setRuleSaving] = useState(false);

  // 룰 필드 업데이트 헬퍼
  const setR = (key, val) => setRule((prev) => ({ ...prev, [key]: val }));

  // 저장 처리
  const handleRuleSave = async () => {
    setRuleSaving(true);
    await onRuleUpdate(rule);
    setRuleSaving(false);
    onClose();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.28)', borderRadius: 10, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(200,155,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>⚙ 운영 메뉴</div>
          <button onClick={onClose} style={{ background: '#2a2810', border: '1px solid rgba(200,155,0,0.2)', color: '#E8DFC0', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div onClick={() => setView('adjust')} style={{ padding: '14px 16px', background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>점수 조정</div>
                  <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>팀 점수를 수동으로 가감합니다</div>
                </div>
              </div>
              <div onClick={() => setView('rule')} style={{ padding: '14px 16px', background: '#141200', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>룰 변경</div>
                  <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>목표 킬, 보너스/패널티 등 규칙을 수정합니다</div>
                </div>
              </div>
              <div onClick={() => setView('end')} style={{ padding: '14px 16px', background: '#141200', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>⏻</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E53935' }}>경기 종료</div>
                  <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>킬내기를 즉시 종료하고 결과를 확정합니다</div>
                </div>
              </div>
            </div>
          )}

          {view === 'adjust' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: '#8A8060', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit' }}>← 메뉴로</button>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 6 }}>대상 팀</div>
                <select value={adjTeamId} onChange={(e) => setAdjTeamId(e.target.value)}
                  style={{ width: '100%', background: '#141200', border: '1px solid rgba(200,155,0,0.25)', color: '#E8DFC0', padding: '9px 12px', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {room.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 6 }}>조정 방향</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['+', '-'].map((s) => (
                      <div key={s} onClick={() => setAdjSign(s)} style={{ flex: 1, padding: '9px', textAlign: 'center', border: `1px solid ${adjSign === s ? (s === '+' ? '#F5A623' : '#E53935') : 'rgba(200,155,0,0.2)'}`, background: adjSign === s ? (s === '+' ? 'rgba(245,166,35,0.1)' : 'rgba(229,57,53,0.1)') : '#141200', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 16, color: adjSign === s ? (s === '+' ? '#F5A623' : '#E53935') : '#8A8060' }}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 6 }}>조정 수치</div>
                  <input type="number" min={1} value={adjAmount} onChange={(e) => setAdjAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '100%', background: '#141200', border: '1px solid rgba(200,155,0,0.25)', color: '#F5A623', padding: '9px 12px', borderRadius: 4, fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#8A8060', marginBottom: 6 }}>사유 (필수)</div>
                <input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="예: 서버 오류로 인한 보상"
                  style={{ width: '100%', background: '#141200', border: `1px solid ${adjReason.trim() ? 'rgba(200,155,0,0.25)' : 'rgba(229,57,53,0.3)'}`, color: '#E8DFC0', padding: '9px 12px', borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                {!adjReason.trim() && (
                  <div style={{ fontSize: 11, color: '#E53935', marginTop: 4 }}>사유를 입력해야 반영할 수 있습니다</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button disabled={!adjReason.trim()} onClick={() => { onAdjust(adjTeamId, adjSign === '+' ? adjAmount : -adjAmount, adjReason); onClose(); }}>반영하기</Button>
              </div>
            </div>
          )}

          {view === 'rule' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: '#8A8060', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit' }}>← 메뉴로</button>

              {/* ── 목표 킬 ── */}
              <RuleRow label="목표 킬 수" desc="이 킬 수에 도달하면 종료 안내가 표시됩니다">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setR('targetKills', Math.max(1, rule.targetKills - 1))} style={rBtnStyle}>−</button>
                  <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 18, color: '#F5A623' }}>{rule.targetKills}</span>
                  <button onClick={() => setR('targetKills', rule.targetKills + 1)} style={rBtnStyle}>+</button>
                </div>
              </RuleRow>

              {/* ── 제한 시간 ── */}
              <RuleRow label="제한 시간" desc={rule.noTimeLimit ? '시간 제한 없음' : `${rule.timeLimitMin}분`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 시간 제한 없음 토글 */}
                  <span style={{ fontSize: 11, color: '#8A8060' }}>제한없음</span>
                  <ToggleMini on={rule.noTimeLimit} onChange={() => setR('noTimeLimit', !rule.noTimeLimit)} />
                  {/* 분 입력 (제한 있을 때만 활성) */}
                  {!rule.noTimeLimit && (
                    <>
                      <button onClick={() => setR('timeLimitMin', Math.max(10, rule.timeLimitMin - 10))} style={rBtnStyle}>−</button>
                      <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#E8DFC0' }}>{rule.timeLimitMin}</span>
                      <button onClick={() => setR('timeLimitMin', Math.min(480, rule.timeLimitMin + 10))} style={rBtnStyle}>+</button>
                      <span style={{ fontSize: 11, color: '#8A8060' }}>분</span>
                    </>
                  )}
                </div>
              </RuleRow>

              <div style={{ borderTop: '1px solid rgba(200,155,0,0.1)', margin: '12px 0' }} />
              <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>보너스</div>

              {/* ── 치킨 보너스 ── */}
              <RuleBonusRow label="치킨 보너스" on={rule.chickenBonusOn} onToggle={() => setR('chickenBonusOn', !rule.chickenBonusOn)}>
                <NumberStepper val={rule.chickenBonus} min={1} disabled={!rule.chickenBonusOn}
                  onChange={(v) => setR('chickenBonus', v)} color="#F5A623" />
              </RuleBonusRow>

              {/* ── 헤드샷 보너스 ── */}
              <RuleBonusRow label="헤드샷 보너스" on={rule.headShotBonusOn} onToggle={() => setR('headShotBonusOn', !rule.headShotBonusOn)}>
                <NumberStepper val={rule.headShotBonus} min={1} disabled={!rule.headShotBonusOn}
                  onChange={(v) => setR('headShotBonus', v)} color="#F5A623" />
              </RuleBonusRow>

              {/* ── 어시스트 보너스 ── */}
              <RuleBonusRow label="어시스트 보너스" on={rule.assistBonusOn} onToggle={() => setR('assistBonusOn', !rule.assistBonusOn)}>
                <NumberStepper val={rule.assistBonus} min={1} disabled={!rule.assistBonusOn}
                  onChange={(v) => setR('assistBonus', v)} color="#F5A623" />
              </RuleBonusRow>

              <div style={{ borderTop: '1px solid rgba(200,155,0,0.1)', margin: '12px 0' }} />
              <div style={{ fontSize: 10, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>패널티</div>

              {/* ── 팀킬 패널티 ── */}
              <RuleBonusRow label="팀킬 패널티" on={rule.teamKillPenaltyOn} onToggle={() => setR('teamKillPenaltyOn', !rule.teamKillPenaltyOn)}>
                <NumberStepper val={rule.teamKillPenalty} min={1} disabled={!rule.teamKillPenaltyOn}
                  onChange={(v) => setR('teamKillPenalty', v)} color="#E53935" />
              </RuleBonusRow>

              {/* ── 조기사망 패널티 ── */}
              <RuleBonusRow label="조기사망 패널티" on={rule.deathPenaltyOn} onToggle={() => setR('deathPenaltyOn', !rule.deathPenaltyOn)}>
                <NumberStepper val={rule.deathPenalty} min={1} disabled={!rule.deathPenaltyOn}
                  onChange={(v) => setR('deathPenalty', v)} color="#E53935" />
              </RuleBonusRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 18 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button onClick={handleRuleSave} loading={ruleSaving}>✓ 저장하기</Button>
              </div>
            </div>
          )}

          {view === 'end' && (
            <div>
              <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: '#8A8060', cursor: 'pointer', fontSize: 12, marginBottom: 14, padding: 0, fontFamily: 'inherit' }}>← 메뉴로</button>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>정말 종료하시겠습니까?</div>
                <div style={{ fontSize: 12, color: '#8A8060', lineHeight: 1.7 }}>종료 시 결과가 확정되고<br />라이브 스코어보드가 닫힙니다.</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8A8060', textAlign: 'center', marginBottom: 6 }}>"종료" 를 입력하세요</div>
                <input value={endConfirm} onChange={(e) => setEndConfirm(e.target.value)} placeholder="종료"
                  style={{ width: '100%', textAlign: 'center', background: '#141200', border: '1px solid rgba(229,57,53,0.4)', color: '#E8DFC0', padding: '10px', borderRadius: 4, fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Button variant="secondary" onClick={() => setView('menu')}>취소</Button>
                <Button disabled={endConfirm !== '종료'} onClick={() => { onEnd(); onClose(); }}
                  style={{ background: endConfirm === '종료' ? '#E53935' : undefined, opacity: endConfirm !== '종료' ? 0.4 : 1 }}>종료하기</Button>
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
  const [sessionId, setSessionId] = useState(null);
  const { user } = useAuth();

  const [room,           setRoom]           = useState(null);
  const [matches,        setMatches]        = useState([]);
  const [adjs,           setAdjs]           = useState([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [pollError,      setPollError]      = useState(false);  // 폴링 실패 여부 (연결 오류 배너용)
  const [showTeamModal,   setShowTeamModal]   = useState(false);  // 팀 결과 입력 모달
  const [selectedTeamId,  setSelectedTeamId]  = useState(null);  // 모달에서 입력할 팀 ID
  const [modalMatchNum,   setModalMatchNum]   = useState(1);      // 모달 타이틀용 팀 매치 순번
  const [showAdminModal,  setShowAdminModal]  = useState(false);
  const [showRoleGuide,   setShowRoleGuide]   = useState(false);
  const [matchError,      setMatchError]      = useState('');
  const [screenshotModal, setScreenshotModal] = useState(null);   // 열린 스크린샷 URL (null이면 닫힘)

  // 내 팀 — 로그인 유저가 속한 팀 (있으면 해당 팀 LEADER)
  const myTeam = room?.teams.find((t) => t.members?.some((m) => m.userId === user?.id));
  // 방장(HOST) userId 및 여부 — 닉네임 관리·점수조정·경기종료·룰변경 권한
  const hostUserId = room?.participants?.find((p) => p.role === 'HOST')?.userId;
  const isHost = hostUserId === user?.id;

  // ── 초기 로드 ──
  useEffect(() => {
    if (!user) return;
    RoomAPI.get(roomCode).then(async (roomRes) => {
      if (!roomRes.success) { setLoading(false); return; }
      const session = roomRes.data;
      setSessionId(session.id);
      setRoom(session);
      setAdjs(session.adjustments || []);
      const matchRes = await RoomAPI.getMatches(session.id);
      if (matchRes.success) setMatches(matchRes.data);
      setLoading(false);
    });
  }, [roomCode, user]);

  // ── 타이머 (1초마다) ──
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── 폴링 (5초마다 매치 목록 갱신) ──
  // 다른 팀이 결과를 제출하면 폴링을 통해 내 화면에도 반영됨
  // 실패 시 화면 상단에 오류 배너 표시, 복구되면 자동으로 사라짐
  // ※ 추후 WebSocket 전환 시 이 useEffect를 교체하고 setPollError 호출 위치만 바꾸면 됨
  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(async () => {
      const matchRes = await RoomAPI.getMatches(sessionId);
      if (matchRes.success) {
        setMatches(matchRes.data);
        setPollError(false);
      } else {
        setPollError(true);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [sessionId]);

  // ── 결과 입력 모달 열기 ──
  // 이 팀이 지금까지 몇 게임을 끝냈는지 계산해서 모달 타이틀에 표시
  const openTeamModal = useCallback((teamId) => {
    const teamMatchCount = matches.filter((m) => m.teamId === teamId).length;
    setSelectedTeamId(teamId);
    setModalMatchNum(teamMatchCount + 1);   // 다음 제출 순번
    setShowTeamModal(true);
    setMatchError('');
  }, [matches]);

  // ── 팀 매치 결과 제출 ──
  // 각 팀이 자신의 게임이 끝날 때마다 독립적으로 호출
  // 다른 팀의 진행과 무관하게 즉시 스코어보드에 반영
  // screenshotFile: OCR에 사용한 이미지 파일 (없으면 null)
  const handleSubmitTeamResult = async (results, claimsChicken, screenshotFile) => {
    const res = await RoomAPI.addTeamMatch(sessionId, selectedTeamId, results, claimsChicken);
    if (!res.success) { setMatchError(res.error); return; }

    let match = res.match;

    // 스크린샷이 있으면 업로드 완료까지 모달을 유지 (버튼 로딩 상태 표시됨)
    // 업로드 실패해도 매치 결과 자체는 정상 등록됨
    if (screenshotFile) {
      const uploadRes = await RoomAPI.uploadMatchScreenshot(sessionId, match.id, screenshotFile);
      if (uploadRes.success) match = { ...match, screenshotUrl: uploadRes.data.screenshotUrl };
    }

    // 업로드까지 완료된 후 모달 닫기
    setShowTeamModal(false);
    setMatchError('');

    // 제출 즉시 로컬 상태에 반영 (폴링 전에 바로 화면에 보임)
    setMatches((prev) => [...prev, match]);
  };

  // ── 점수 조정 ──
  const handleAdjust = async (teamId, amount, reason) => {
    const res = await RoomAPI.addAdjustment(sessionId, teamId, amount, reason);
    if (res.success) setAdjs(res.data.adjustments);
  };

  // ── 룰 변경 ──
  // 운영자가 진행 중에 목표 킬·보너스·패널티 등을 수정할 수 있음
  // 저장 후 room 상태를 갱신하면 calcTeamScore 등이 즉시 새 룰로 재계산됨
  const handleRuleUpdate = async (newRule) => {
    const res = await RoomAPI.updateRule(sessionId, newRule);
    if (res.success) setRoom((prev) => ({ ...prev, rule: res.data.rule || newRule }));
  };

  // ── 경기 종료 ──
  const handleEnd = async () => {
    const res = await RoomAPI.end(sessionId);
    if (res.success) router.push(`/room/${roomCode}/result`);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8060' }}>
      불러오는 중...
    </div>
  );

  if (!room) return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
      방을 찾을 수 없습니다
    </div>
  );

  const { rule, teams } = room;

  // 팀별 총점 (내림차순 정렬)
  const teamScores = [...teams]
    .map((t) => ({ ...t, ...calcTeamScore(t.id, matches, rule, adjs) }))
    .sort((a, b) => b.total - a.total);

  const maxScore = Math.max(1, ...teamScores.map((t) => t.total));

  // 남은 시간
  const timeLimit = rule.noTimeLimit ? null : rule.timeLimitMin * 60;
  const timeLeft  = timeLimit ? Math.max(0, timeLimit - elapsed) : null;

  // ── 경기 종료 조건 체크 ──
  // 목표 킬에 먼저 도달한 팀이 있거나, 제한 시간이 만료되면 종료 안내
  const targetReachedTeam = teamScores.find((t) => t.kills >= rule.targetKills);
  const timeOver          = timeLeft !== null && timeLeft === 0;
  const gameOver          = !!targetReachedTeam || timeOver;

  return (
    <div style={{ minHeight: '100vh', background: '#12100A', display: 'flex', flexDirection: 'column' }}>

      {/* ── 연결 오류 배너 ── */}
      {/* 폴링 실패 시 표시. WebSocket 전환 후에는 ws.onerror / ws.onclose 에서 setPollError(true) 호출로 교체 */}
      {pollError && (
        <div style={{
          background: '#3B1111', borderBottom: '1px solid rgba(229,57,53,0.4)',
          padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: '#E53935', flexShrink: 0,
        }}>
          <span>⚠</span>
          <span>서버와의 연결이 불안정합니다. 점수가 실시간으로 반영되지 않을 수 있습니다.</span>
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{ background: '#1C1A0C', borderBottom: '1px solid rgba(200,155,0,0.18)', padding: '0 22px', height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(200,155,0,0.1)', border: '1px solid rgba(200,155,0,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎯</div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>LIVE SCOREBOARD</div>
            <div style={{ fontSize: 10, color: '#8A8060', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#4CAF50' }}>● LIVE</span>
              <span>{room.title}</span>
              <span>|</span>
              <span>매치 {matches.length}판</span>
              {isHost && <span style={{ color: '#FFD700', fontWeight: 700 }}>| 👑 방장</span>}
              {myTeam && <span style={{ color: '#F5A623', fontWeight: 700 }}>| ★ {myTeam.name} LEADER</span>}
            </div>
          </div>
        </div>

        {/* 역할 안내 + 타이머 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowRoleGuide(true)}
            title="역할 안내"
            style={{ background: 'rgba(200,155,0,0.08)', border: '1px solid rgba(200,155,0,0.22)', color: '#8A8060', width: 30, height: 30, borderRadius: 4, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}
          >?</button>
          <div style={{ background: '#141200', border: '1px solid rgba(200,155,0,0.22)', borderRadius: 4, padding: '7px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#8A8060', letterSpacing: 1.5, marginBottom: 2 }}>경과 시간</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 18, fontWeight: 700 }}>{fmtTime(elapsed)}</div>
          </div>
          {timeLeft !== null && (
            <div style={{ background: '#1a0808', border: '1px solid rgba(229,57,53,0.35)', borderRadius: 4, padding: '7px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#8A8060', letterSpacing: 1.5, marginBottom: 2 }}>남은 시간</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 18, fontWeight: 700, color: timeLeft < 300 ? '#E53935' : '#E8DFC0' }}>{fmtMMSS(timeLeft)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── 경기 종료 조건 달성 배너 ── */}
      {gameOver && (
        <div style={{
          background: targetReachedTeam ? 'rgba(245,166,35,0.12)' : 'rgba(229,57,53,0.1)',
          borderBottom: `1px solid ${targetReachedTeam ? 'rgba(245,166,35,0.4)' : 'rgba(229,57,53,0.4)'}`,
          padding: '12px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{targetReachedTeam ? '🏆' : '⏰'}</span>
            <div>
              {targetReachedTeam ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F5A623' }}>
                    {targetReachedTeam.name} — 목표 킬 {rule.targetKills}킬 달성!
                  </div>
                  <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>
                    경기를 종료하고 최종 결과를 확정하세요
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E53935' }}>
                    제한 시간 종료!
                  </div>
                  <div style={{ fontSize: 11, color: '#8A8060', marginTop: 2 }}>
                    더 이상 새 매치를 시작할 수 없습니다 · 경기를 종료해주세요
                  </div>
                </>
              )}
            </div>
          </div>
          {/* 빠른 경기 종료 버튼 (방장만) */}
          {isHost && (
            <Button onClick={handleEnd} style={{ fontSize: 13, background: '#E53935', color: '#fff', flexShrink: 0 }}>
              ⏻ 경기 종료
            </Button>
          )}
        </div>
      )}

      {/* ── 본문 ── */}
      <div style={{ flex: 1, padding: '16px 22px', overflowY: 'auto' }}>

        {/* 팀별 점수 카드 */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>팀 현황</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teamScores.length, 4)}, 1fr)`, gap: 12 }}>
            {teamScores.map((t, idx) => {
              const isFirst       = idx === 0;
              const safeTarget    = rule.targetKills > 0 ? rule.targetKills : 1;
              const progress      = Math.min(100, Math.round((t.kills / safeTarget) * 100));
              const isTargetDone  = t.kills >= rule.targetKills;  // 이 팀이 목표 킬 달성했는지
              return (
                <div key={t.id} style={{
                  background: '#1C1A0C',
                  border: `1px solid ${isTargetDone ? 'rgba(245,166,35,0.7)' : isFirst ? 'rgba(245,166,35,0.45)' : 'rgba(200,155,0,0.15)'}`,
                  borderRadius: 8, padding: '14px 16px',
                  boxShadow: isTargetDone ? '0 0 16px rgba(245,166,35,0.15)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: isTargetDone ? '#F5A623' : '#8A8060', letterSpacing: 1.5, fontWeight: isTargetDone ? 700 : 400 }}>
                      {isTargetDone ? '🏆 WINNER' : `RANK #${idx + 1}`}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: isFirst ? '#F5A623' : 'white', lineHeight: 1 }}>{t.total}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#8A8060', marginBottom: 8 }}>
                    목표: {rule.targetKills}킬 &nbsp;
                    <span style={{ color: isTargetDone ? '#4CAF50' : '#8A8060', fontWeight: isTargetDone ? 700 : 400 }}>
                      {t.kills}/{rule.targetKills}킬 {isTargetDone ? '✓ 달성' : `(${Math.round(progress)}%)`}
                    </span>
                  </div>
                  {/* 프로그레스바 */}
                  <div style={{ background: 'rgba(200,155,0,0.1)', borderRadius: 2, height: 5, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: isTargetDone ? '#4CAF50' : isFirst ? '#F5A623' : '#8A8060', width: `${progress}%`, transition: 'width .4s' }} />
                  </div>
                  {/* 킬/보너스/패널티 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, gap: 2 }}>
                    {[
                      { label: '킬',   val: t.kills,   color: '#E8DFC0' },
                      { label: '보너스', val: `+${t.bonus}`, color: '#F5A623' },
                      { label: '패널티', val: `-${t.penalty}`, color: '#E53935' },
                    ].map((s) => (
                      <div key={s.label}>
                        <div style={{ color: '#8A8060' }}>{s.label}</div>
                        <div style={{ fontWeight: 700, color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  {t.adj !== 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: t.adj > 0 ? '#F5A623' : '#E53935' }}>
                      조정: {t.adj > 0 ? '+' : ''}{t.adj}
                    </div>
                  )}

                  {/* 팀별 매치 제출 현황 */}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(200,155,0,0.1)' }}>
                    {/* 이 팀이 지금까지 제출한 게임 수 */}
                    {(() => {
                      const teamMatchCount = matches.filter((m) => m.teamId === t.id).length;
                      return (
                        <div style={{ fontSize: 10, color: '#8A8060', textAlign: 'center', marginBottom: myTeam?.id === t.id ? 6 : 0 }}>
                          {teamMatchCount > 0 ? `${teamMatchCount}게임 완료` : '아직 결과 없음'}
                        </div>
                      );
                    })()}
                    {/* 내 팀 유저면 누구나 결과 입력 가능 (각 팀 LEADER) */}
                    {myTeam?.id === t.id && (
                      <button
                        onClick={() => openTeamModal(t.id)}
                        style={{ width: '100%', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623', borderRadius: 4, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        ✏ 결과 입력
                      </button>
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
            <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10 }}>개인 통계</div>
            <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, overflow: 'hidden' }}>
              {teams.map((team, tIdx) => {
                const stats = team.players.map((nick) => ({ nick, ...calcPlayerStats(nick, matches, rule) }))
                  .sort((a, b) => b.kills - a.kills);
                return (
                  <div key={team.id}>
                    <div style={{ background: 'rgba(200,155,0,0.06)', borderLeft: '3px solid #F5A623', padding: '8px 14px', fontSize: 12, fontWeight: 700, borderTop: tIdx > 0 ? '1px solid rgba(200,155,0,0.1)' : 'none' }}>
                      {team.name}
                    </div>
                    {stats.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>플레이어 없음</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(200,155,0,0.08)' }}>
                            {['닉네임', '킬', '보너스', '패널티', '총점'].map((h) => (
                              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#8A8060', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((p) => (
                            <tr key={p.nick} style={{ borderBottom: '1px solid rgba(200,155,0,0.06)' }}>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.nick}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13 }}>{p.kills}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: '#F5A623' }}>{p.bonus > 0 ? `+${p.bonus}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: p.penalty > 0 ? '#E53935' : '#666' }}>{p.penalty > 0 ? `-${p.penalty}` : '0'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 17, fontWeight: 700, color: '#F5A623' }}>{p.total}</td>
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
            <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>매치 히스토리</span>
              {matches.length > 30 && (
                <span style={{ fontSize: 10, color: '#555' }}>{matches.length}게임 중 최근 30개</span>
              )}
            </div>
            <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
              {matches.length === 0 ? (
                <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>아직 결과 없음</div>
              ) : (
                [...matches].reverse().slice(0, 30).map((m) => {
                  const team       = teams.find((t) => t.id === m.teamId);
                  const totalKills = (m.results || []).reduce((s, r) => s + r.kills, 0);
                  const hasChicken = m.chickenTeamId === m.teamId;
                  const hasShot    = !!m.screenshotUrl;
                  return (
                    <div
                      key={m.id}
                      onClick={() => hasShot && setScreenshotModal({ url: m.screenshotUrl, match: m, team })}
                      style={{
                        padding: '9px 0', borderBottom: '1px solid rgba(200,155,0,0.07)',
                        cursor: hasShot ? 'pointer' : 'default',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => hasShot && (e.currentTarget.style.background = 'rgba(200,155,0,0.05)')}
                      onMouseLeave={(e) => hasShot && (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#F5A623' }}>
                            {team?.name ?? '?'} #{m.teamMatchNumber}
                          </span>
                          {hasChicken && <span style={{ fontSize: 10 }}>🍗</span>}
                          {/* 스크린샷 있을 때 카메라 아이콘 표시 */}
                          {hasShot && (
                            <span style={{ fontSize: 10, color: '#8A8060' }} title="스크린샷 보기">📷</span>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: '#555' }}>{new Date(m.createdAt).toLocaleTimeString('ko')}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8060' }}>
                        킬: <b style={{ color: '#E8DFC0' }}>{totalKills}</b>
                        {m.results.map((r) => (
                          <span key={r.nick} style={{ marginLeft: 6 }}>{r.nick} {r.kills}킬</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 수동 조정 내역 */}
            {adjs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#8A8060', letterSpacing: 2, marginBottom: 8 }}>점수 조정 내역</div>
                <div style={{ background: '#1C1A0C', border: '1px solid rgba(200,155,0,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                  {adjs.map((a) => {
                    const team = teams.find((t) => t.id === a.teamId);
                    return (
                      <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(200,155,0,0.06)', fontSize: 11 }}>
                        <span style={{ color: '#8A8060' }}>{team?.name}</span>
                        <span style={{ marginLeft: 8, color: a.amount > 0 ? '#F5A623' : '#E53935', fontWeight: 700 }}>
                          {a.amount > 0 ? '+' : ''}{a.amount}
                        </span>
                        <div style={{ color: '#555', marginTop: 2 }}>{a.reason}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── 하단 바 ── */}
      <div style={{ background: '#1C1A0C', borderTop: '1px solid rgba(200,155,0,0.18)', padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12, flexWrap: 'wrap' }}>

        {/* 왼쪽: 상태 안내 */}
        <div style={{ fontSize: 12 }}>
          {gameOver ? (
            <span style={{ color: targetReachedTeam ? '#F5A623' : '#E53935', fontWeight: 700 }}>
              {targetReachedTeam ? `🏆 ${targetReachedTeam.name} 목표 킬 달성` : '⏰ 시간 종료'} — 경기를 종료해주세요
            </span>
          ) : (
            <span style={{ color: '#8A8060' }}>
              {isHost && <span style={{ color: '#FFD700', fontWeight: 700, marginRight: 4 }}>👑 방장</span>}
              {myTeam ? `★ ${myTeam.name} LEADER` : '관전자'} —&nbsp;
              {myTeam
                ? '게임이 끝날 때마다 내 팀 카드의 [결과 입력]으로 결과를 제출하세요'
                : '각 팀 LEADER가 게임 결과를 입력합니다'}
            </span>
          )}
        </div>

        {/* 오른쪽: 버튼 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* 에러 메시지 */}
          {matchError && (
            <span style={{ fontSize: 11, color: '#E53935' }}>⚠ {matchError}</span>
          )}
          {/* 운영 메뉴 (방장만) — 점수 조정·룰 변경·경기 종료 */}
          {isHost && (
            <Button variant="ghost" onClick={() => setShowAdminModal(true)} style={{ fontSize: 12 }}>⚙ 운영 메뉴</Button>
          )}
        </div>
      </div>

      {/* ── 모달 ── */}
      {showTeamModal && selectedTeamId && (
        <TeamResultModal
          room={room}
          teamId={selectedTeamId}
          matchNumber={modalMatchNum}
          onSubmit={handleSubmitTeamResult}
          onClose={() => setShowTeamModal(false)}
        />
      )}
      {showAdminModal && (
        <AdminModal
          room={room}
          onAdjust={handleAdjust}
          onEnd={handleEnd}
          onRuleUpdate={handleRuleUpdate}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* 스크린샷 뷰어 */}
      {screenshotModal && (
        <ScreenshotModal
          info={screenshotModal}
          onClose={() => setScreenshotModal(null)}
        />
      )}

      {/* ── 역할 안내 모달 ── */}
      {showRoleGuide && (
        <RoleGuideModal onClose={() => setShowRoleGuide(false)} />
      )}
    </div>
  );
}
