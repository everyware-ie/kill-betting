# 팀 구성 권한 위임 & 닉네임 즐겨찾기

- FRD: https://github.com/everyware-ie/mechuri-docs/blob/main/products/kill-betting/specs/frd/team-setup-delegation.md
- 이슈: #104, #105, #106
- 참조 시점: 2026-07-25 / 허브 커밋 5ca2134 / status: approved
- 구현 상태: 진행 중 (#104)

## 구현 노트

허브 approved FRD가 유일한 근거다. 여기엔 링크와 구현 메모만 둔다.

### 이슈 분해

| 이슈 | 범위 | FRD 근거 |
|---|---|---|
| #104 | 팀 구성 권한 위임 — 리더가 본인 팀 팀원 관리 | T1~T4, §5 |
| #105 | 닉네임 즐겨찾기 — 엔티티·API·마이페이지 | T5, T8, §6 |
| #106 | setup 연동 — 즐겨찾기·최근 함께한 닉네임 선택 UI | T6, T7, §2·§3 |

### #104 구현 메모

- `TeamConfigureService`의 팀원 조작 3종(`addPlayer`·`updatePlayer`·`removePlayer`)만 권한을 완화한다.
- 팀 구조를 바꾸는 조작(`assignLeader`·`unassignLeader`, 팀 생성/삭제)은 **`validateHost` 유지** — FRD T3.
- Host는 상위 권한으로 계속 모든 팀을 조작할 수 있다(T2). 즉 새 검증은 "Host **또는** 해당 팀 리더".

## 어긋남 기록

(없음)
