/**
 * ============================================================
 *  lib/ocr-api.js — PUBG 결과 스크린샷 OCR API 레이어
 * ============================================================
 *
 *  ✅ 백엔드 팀 연동 가이드
 *
 *  1. USE_MOCK = false 로 변경 (lib/api.js 와 동일한 플래그 사용)
 *  2. 아래 [실제 API 스펙]대로 백엔드 구현 후 연결
 *
 * ──────────────────────────────────────────
 *  [실제 API 스펙]
 *
 *  POST /ocr/pubg-screenshot
 *
 *  Request (multipart/form-data):
 *    screenshot : File      — 업로드할 이미지 파일 (jpg/png)
 *    players    : string    — JSON.stringify([nick1, nick2, ...])
 *                            (방에 등록된 닉네임 목록, OCR 매칭 힌트용)
 *
 *  Response 200:
 *  {
 *    ok: true,
 *    players: [
 *      {
 *        nick      : string,   // 인식된 닉네임
 *        kills     : number,   // 킬 수
 *        damage    : number,   // 데미지
 *        headShot  : boolean,  // 헤드샷 여부
 *        assist    : boolean,  // 어시스트 여부
 *        teamKills : number,   // 팀킬 수
 *        earlyDeath: boolean,  // 일찍 사망 여부
 *      }
 *    ],
 *    unmatched: string[]  // OCR에서 인식됐지만 방 닉네임과 매칭 안 된 것들
 *  }
 *
 *  Response 400: { ok: false, error: '이미지를 읽을 수 없습니다' }
 *  Response 422: { ok: false, error: '결과 화면이 아닙니다' }
 *
 * ──────────────────────────────────────────
 *  [Mock 동작]
 *
 *  실제 OCR 없이 테스트할 수 있도록
 *  방에 등록된 닉네임 기준으로 임의의 결과값을 반환합니다.
 *  (화면에 "MOCK" 라벨로 표시됨)
 *
 * ============================================================
 */

import { USE_MOCK } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/** 딜레이 헬퍼 */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** 실패 응답 헬퍼 */
const err = (msg) => ({ ok: false, error: msg });

export const OcrAPI = {

  /**
   * PUBG 결과 스크린샷 분석
   *
   * @param {File}     file    — 업로드할 이미지 파일
   * @param {string[]} players — 방에 등록된 배그 닉네임 목록 (매칭 힌트)
   *
   * @returns {{ ok: boolean, players: OcrPlayer[], unmatched: string[] }}
   *
   * 사용 예시:
   *   const file = e.target.files[0];
   *   const nicks = room.teams.flatMap(t => t.players);
   *   const res = await OcrAPI.parseScreenshot(file, nicks);
   *   if (res.ok) {
   *     // res.players 로 결과 테이블 자동 채우기
   *   }
   */
  parseScreenshot: async (file, players = []) => {

    // ── Mock 모드 ──
    if (USE_MOCK) {
      await delay(1500); // OCR 처리 시간 시뮬레이션

      if (!file) return err('파일이 없습니다');

      // Mock: 등록된 닉네임 기준으로 임의의 결과 생성
      // 실제 OCR 연결 후에는 이 블록이 실행되지 않음
      const mockPlayers = players.map((nick) => ({
        nick,
        kills:      Math.floor(Math.random() * 8),          // 0~7 킬
        damage:     Math.floor(Math.random() * 600 + 50),   // 50~650 데미지
        headShot:   Math.random() > 0.6,                    // 40% 확률
        assist:     Math.random() > 0.7,                    // 30% 확률
        teamKills:  Math.random() > 0.9 ? 1 : 0,           // 10% 확률로 팀킬 1
        earlyDeath: Math.random() > 0.8,                    // 20% 확률
      }));

      return { ok: true, players: mockPlayers, unmatched: [], isMock: true };
    }

    // ── 실제 API 호출 ──
    // TODO: 백엔드 팀이 /ocr/pubg-screenshot 엔드포인트 구현 후 자동으로 여기가 실행됨
    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      formData.append('players', JSON.stringify(players)); // 닉네임 목록을 힌트로 전달

      const res = await fetch(`${API_BASE_URL}/ocr/pubg-screenshot`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // Content-Type은 브라우저가 자동으로 multipart/form-data 로 설정
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) return err(data.error || 'OCR 처리 중 오류가 발생했습니다');
      return data;

    } catch (e) {
      return err('서버에 연결할 수 없습니다');
    }
  },
};
