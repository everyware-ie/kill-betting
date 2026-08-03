---
title: 매치 결과 업로드 FRD
product: kill-betting
type: frd
status: approved
updated: 2026-07-15
related: [kill-betting-core, session, match-confirm]
code_repo: https://github.com/everyware-ie/kill-betting
---

# 매치 결과 업로드 — 기능정의서 (FRD)

> 상위 PRD: [kill-betting-core](../prd/kill-betting-core.md) (`approved`). 코드 기준(2026-07-15 검증).

## 1. 개요

매치가 끝나면 팀 리더가 결과 화면 스크린샷을 업로드한다. 서버는 이미지를 저장하고 OCR로 킬·데미지·어시스트·등수 등을 자동 인식해 반환한다. 이 시점에는 아직 확정되지 않은 `PENDING` 상태 매치 레코드만 생성되며, 실제 팀 점수 반영은 [승인(confirm)](match-confirm.md) 단계에서 일어난다.

## 2. 사용자 플로우

1. 팀 Leader가 진행 화면(`room/[id]/live`)에서 "결과 업로드" 진입
2. 스크린샷 파일 선택 후 업로드
3. 서버: 파일을 스토리지(S3)에 저장 → Match 레코드를 `PENDING` 상태로 생성(팀별 matchNumber 자동 증가) → OCR 클라이언트로 파싱 요청
4. 파싱 결과(순위, 맵, 플레이타임, 플레이어별 스탯)를 업로드 응답으로 즉시 반환
5. 클라이언트가 파싱 결과를 화면에 보여주고, 리더가 확인·수정 후 확정 ([승인 FRD](match-confirm.md)로 이어짐)

## 3. 화면/인터랙션 정의

| 화면 ID | 이름 | 주요 구성 |
|---|---|---|
| room/[id]/live (업로드 모달) | 결과 업로드 | 이미지 선택, 업로드 버튼, 진행 표시 |

## 4. 기능 규칙 (Business Rules)

| # | 규칙 | 근거 |
|---|---|---|
| U1 | 업로드는 **해당 세션에서 리더로 배정된 팀의 리더**만 가능. 리더로 배정된 팀이 없으면 실패 | `SessionMatchService.uploadMatchImage` |
| U2 | 업로드 시점에 Match가 **`PENDING` 상태로 즉시 생성**된다(승인 전). 팀별 matchNumber는 1부터 순차 증가 | `MatchService.uploadScreenshot` |
| U3 | 이미지는 스토리지에 먼저 저장 후 URL을 Match에 기록. 저장 실패 시 예외로 중단(성공/실패 메트릭 기록) | `MatchService` |
| U4 | OCR은 Naver OCR 사용. 반환값: 등수·맵·플레이타임·플레이어별(닉네임, 킬, 데미지, 어시스트, Top10 여부) | `OcrClient` / `MatchOcrResult` |
| U5 | OCR 오인식(예: 0↔O, 스킨 적용 시 닉네임 미인식)은 자동 보정 로직 없이 사용자가 승인 단계에서 직접 수정 | 노션 요구사항목록, [승인 FRD](match-confirm.md) |

## 5. 예외 처리

| 상황 | 처리 |
|---|---|
| 업로더가 이 세션의 리더가 아님 | 404 "해당 세션에서 Leader로 배정된 팀을 찾을 수 없습니다" |
| 스토리지 저장 실패 | 예외 전파, 업로드 실패 메트릭 증가 |
| 파일명에 확장자 없음 | 이미지 포맷을 `jpg`로 간주(업로드 자체를 막지는 않음) |

## 6. 데이터

- **Match** (생성 시점): session, team, matchNumber, screenshotUrl, status=`PENDING`
- **MatchOcrResult** (영속화 안 됨, 업로드 응답으로만 전달): placement, mapName, playTime, playerStats[]

## 7. 비기능 요구 / 정책 연계

- 업로드 소요시간 타이머 메트릭(`storage.upload.duration`), 성공/실패 카운터(`storage.upload{result}`), 업로드 건수 카운터(`match.screenshot.uploaded`)

## 8. 구현 노트 링크

kill-betting `docs/product/features/match-upload.md` (스텁, 필요 시 생성)
