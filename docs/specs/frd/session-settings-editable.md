---
title: 세션 설정 수정 & 자동종료 정책 FRD
product: kill-betting
type: frd
status: approved
updated: 2026-07-28
related: [session, kill-betting-core]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 세션 설정 수정 & 자동종료 정책 — 기능정의서 (FRD)

> 상위: [session.md](session.md)(기존 승인 FRD), [2026-07-22 결정](../../decisions/2026-07-22-session-settings-and-lifecycle.md). status: `approved`(2026-07-28 승격) — 구현 근거로 유효하다.
> 출처: [2026-07-22 회의 종합](../../meetings/2026-07-22/synthesis.md) — 사용자 인터뷰 항목 1, 5, 7-방삭제.
> **담당: jminkkk**

## 1. 개요

인터뷰에서 세 가지 문제/요청이 확인됐다. ① 방 생성 후 설정(목표킬/제한시간)을 바꿔도 반영되지 않는다 — 코드 확인 결과 애초에 수정 기능이 없다(단, 재테스트에서는 되는 것처럼 보이기도 해 재현 조건 확인 필요, ②와 관련 가능성). ② 제한시간을 걸어도 세션이 자동 종료되지 않는 경우가 있다 — 코드 확인 결과 인메모리 타이머 구조의 구조적 취약점으로 추정된다. ③ 세션이 방치되는 경우의 자동 종료·삭제 정책 자체가 없다.

## 2. 사용자 플로우

1. Host가 `room/[id]/setup`에서 목표킬·제한시간을 수정 → 저장 → **WAITING·IN_PROGRESS 상태 모두** 즉시 반영(2026-07-28 결정, 원래 계획은 WAITING 한정이었음 — §4 S1 참고)
2. 세션 시작 시 제한시간이 설정돼 있으면 타이머 등록 → 시간 만료 시 자동 종료(신뢰성 개선 대상)
3. (신규) 세션 시작 후 마지막 매치 등록으로부터 **6시간** 동안 새 매치 등록이 없으면 자동 종료
4. (신규) 세션 생성 후 **3시간** 동안 시작되지 않으면(WAITING 방치) 자동 삭제
5. (신규) Host가 언제든 방을 **수동으로 삭제**할 수 있음

## 3. 화면/인터랙션 정의

| 화면 ID | 변경 사항 |
|---|---|
| room/[id]/setup | 목표킬·제한시간 필드에 "저장" 액션 추가 (현재는 표시만 되고 저장 로직이 없거나 무시됨). "방 삭제" 버튼 추가(Host 전용) |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| S1 | 목표킬·제한시간 수정은 **Host만**, **WAITING·IN_PROGRESS 상태 모두** 가능(ENDED만 불가). 진행중 세션 수정 시 **이전에 확정된 매치 점수는 소급 변경되지 않는다**(`Match.confirm`이 확정 시점 점수를 동결하므로 자동 성립) | 원래는 WAITING 한정이었으나 [kill-betting#124](https://github.com/everyware-ie/kill-betting/pull/124)로 WAITING+IN_PROGRESS 둘 다 구현됨. 2026-07-28 회의에서 "그게 맞는 결정"으로 확정 — [2026-07-22 결정 개정](../../decisions/2026-07-22-session-settings-and-lifecycle.md#개정-2026-07-28-2-s1-편집-허용-범위) |
| S2 | 값 검증은 기존 생성 시 검증과 동일(목표킬 1 이상, 제한시간 1분 이상) | `Session` 생성자 검증 로직 재사용 |
| S3 | 제한시간 자동종료는 **DB에 근거해 신뢰성 있게 동작**해야 한다 — 현재 인메모리 `TaskScheduler` 단독 의존은 서버 재배포/재시작 시 유실 위험이 있으므로, 최소 재시작 복구 로직(`recoverInProgressSessions`)이 실제로 정상 동작하는지 검증하고, 필요 시 주기적 폴링(예: 1분 간격 배치로 만료된 IN_PROGRESS 세션 조회 후 종료 처리)으로 보완 | `SessionTimerService` 코드 확인 — 상세는 §7 |
| S4 | **진행중 세션 무응답 자동종료**: 세션 시작 후 마지막 매치 등록(confirm) 시점 기준 **6시간** 동안 새 매치 등록이 없으면 세션 자동 종료. "마지막 행동"은 매치 등록으로만 정의(다른 사용자 행동은 포함하지 않음 — 회의에서 명시적으로 범위 제한) | [2026-07-22 결정](../../decisions/2026-07-22-session-settings-and-lifecycle.md) |
| S5 | **대기중 세션 자동삭제(신규)**: 세션 생성 후 **3시간** 동안 시작되지 않으면(WAITING 상태 유지) 자동 삭제. 임계값은 2026-07-28 채널 밖(카톡) 논의로 1시간→3시간 재조정되어 구현됨([kill-betting#123](https://github.com/everyware-ie/kill-betting/pull/123)) — §7 쿼리로 사후 검증 아직 미실시, 필요 시 재검증 | [2026-07-22 결정](../../decisions/2026-07-22-session-settings-and-lifecycle.md) — [2026-07-28 개정](../../decisions/2026-07-22-session-settings-and-lifecycle.md#개정-2026-07-28) |
| S6 | **방 수동 삭제(신규)**: Host는 언제든(상태 무관) 방을 직접 삭제할 수 있다 | phs00 추가 의견 |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| Host 아닌 사용자가 설정 수정/삭제 시도 | 403 |
| ENDED 세션에서 설정 수정 시도 | 400 (WAITING·IN_PROGRESS는 허용 — 2026-07-28 결정) |
| 목표킬/제한시간을 최소값 미만으로 수정 시도 | 400 (기존 검증 재사용) |
| IN_PROGRESS 세션 삭제 시도 시 확정된 매치·점수가 있는 경우 | `[미결: 삭제 확인 경고(2단계 확인) 필요 여부 판단]` |

## 6. 데이터

- `Session.targetKills`, `Session.timeLimitMinutes` — 수정 가능하도록 세터/업데이트 메서드 추가 필요
- 진행중 무응답 자동종료를 위해 "마지막 매치 등록 시각" 추적 필요 — `Session`에 필드 추가 또는 마지막 `Match.createdAt` 조회로 계산
- 대기중 자동삭제를 위한 배치/스케줄러 필요(생성 후 3시간 경과 + 여전히 WAITING인 세션 주기 조회) — [kill-betting#123](https://github.com/everyware-ie/kill-betting/pull/123)으로 구현 완료

## 7. 비기능 요구 / 진단 노트 / 임계값 근거 쿼리

- **제한시간 미작동 재현 정보**: 10분 설정 후 9시간 경과, 남은 시간 0 표시. `scheduleExpiry()`는 `startSession()`에서 정상 호출되는 것으로 코드상 확인됨. 9시간 지연은 다음 중 하나로 추정(로그 확인 전 확정 불가):
  - 서버 재배포/재시작으로 인메모리 타이머 유실 + 복구 로직 미작동
  - 다중 인스턴스 환경에서 타이머가 다른 인스턴스에만 등록됨
  - `TaskScheduler` 스레드풀 경합
  - **담당자는 서버 로그(배포 이력·`SessionTimerService` 로그)부터 확인 후 원인 확정 권장**
- 근본적으로 인메모리 스케줄은 재배포가 잦은 사이드 프로젝트 환경에 취약 — 배치/폴링 기반으로 전환하면 재시작에도 안전

### S5(3시간 자동삭제) 임계값 근거 확보 쿼리 — 사후 검증용, 아직 미실시

`sessions` 테이블의 `created_at`/`started_at`으로 "정상적으로 시작된 세션"(`started_at IS NOT NULL`)의 생성→시작 소요시간을 분석한다.

```sql
-- 1) 평균·최소·최대·건수
SELECT
  COUNT(*) AS started_session_count,
  ROUND(AVG(TIMESTAMPDIFF(SECOND, created_at, started_at)) / 60, 1) AS avg_minutes_to_start,
  ROUND(MIN(TIMESTAMPDIFF(SECOND, created_at, started_at)) / 60, 1) AS min_minutes,
  ROUND(MAX(TIMESTAMPDIFF(SECOND, created_at, started_at)) / 60, 1) AS max_minutes
FROM sessions
WHERE started_at IS NOT NULL;

-- 2) 중앙값·p90 (자동삭제 임계값 검증에 더 유용 — 평균은 이상치에 취약)
SELECT
  diff_min,
  PERCENT_RANK() OVER (ORDER BY diff_min) AS pct
FROM (
  SELECT TIMESTAMPDIFF(MINUTE, created_at, started_at) AS diff_min
  FROM sessions
  WHERE started_at IS NOT NULL
) t
ORDER BY pct;
-- pct가 0.5에 가장 가까운 행 = 중앙값, 0.9에 가장 가까운 행 = p90

-- 3) 원본 리스트 (분포를 눈으로 보고 싶으면 CSV로 내보내기)
SELECT id, room_code, created_at, started_at,
       TIMESTAMPDIFF(MINUTE, created_at, started_at) AS minutes_to_start
FROM sessions
WHERE started_at IS NOT NULL
ORDER BY minutes_to_start DESC;
```

**실행 방법**: 프로덕션 DB 접속 경로(배스천/SSH 터널 등)로 MySQL 클라이언트(CLI 또는 TablePlus/DBeaver)에서 실행. p90이 3시간보다 훨씬 짧다면 3시간 임계값은 안전한 여유값. p90이 3시간에 근접하면 정상 사용자까지 삭제될 위험이 있어 임계값 상향 검토 필요.

## 8. 구현 노트 링크

kill-betting `docs/product/features/session-settings-editable.md` (스텁, 구현 시 생성)
