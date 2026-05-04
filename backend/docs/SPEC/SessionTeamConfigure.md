## 1. Overview

- 하나의 세션에는 여러 팀이 참여하여 대결한다
- 각 팀은 **PUBG 닉네임 기반 플레이어 슬롯 최대 4개** + **Operator 슬롯 1개**로 구성된다
- Operator는 반드시 서비스 회원이어야 하며, 매치 결과 업로드를 담당한다
- 로그인한 유저가 세션에 참여할 경우 자동으로 Operator 슬롯 지정을 위한 대기석에 입장된다
- PUBG 닉네임은 Host만 입력할 수 있다
- 세션 구성 과정은 **실시간으로 동기화**된다

---

## 2. Roles & Definitions

| 역할 | 설명 |
| --- | --- |
| **Host** | 세션 생성자. 팀 생성, 닉네임 입력, 대기석→팀 이동 권한 보유. 본인도 한 팀의 Operator |
| **Operator** | 팀당 1명. 서비스 회원. 매치 결과 업로드 담당. Host가 대기석에서 배정 |
| **Team Member** | PUBG 닉네임 기반 플레이어. 비회원 가능. Host가 입력 |

---

## 3. User Flow

1. Host가 세션 생성
2. Host가 팀 생성 (N개)
3. 로그인 사용자(Host 제외)가 세션 입장 → 자동으로 **대기석**에 배치
4. Host가 각 팀의 **닉네임 슬롯**에 PUBG 닉네임 입력 (팀당 최대 4개)
5. Host가 **대기석 → 팀**으로 사용자 이동 → 해당 팀의 Operator로 자동 지정
6. Host 본인도 한 팀의 Operator 슬롯에 배정
7. 모든 팀에 Operator 배정 완료 → 세션 준비 완료

---

## 4. Functional Requirements

### 4.1 세션 구성

- 세션은 2개 이상의 팀을 포함해야 한다
- 각 팀은 닉네임 슬롯 최대 4개 + Operator 슬롯 1개로 구성된다

### 4.2 대기석 (Waiting Area)

- 로그인 사용자(Host 제외)는 세션 입장 시 자동으로 대기석에 배치된다
- 대기석 ↔ 팀 이동은 **Host만** 수행할 수 있다
- 한 사용자는 하나의 팀에만 Operator로 배정될 수 있다 (중복 배정 불가)

### 4.3 Operator

- 팀당 정확히 1명의 Operator가 존재해야 한다
- Operator는 반드시 서비스 회원이어야 한다
- Host가 대기석에서 팀으로 이동시키면 해당 사용자가 Operator로 자동 지정된다
- Host 본인도 한 팀의 Operator가 된다

### 4.4 닉네임 입력

- 팀원 닉네임(PUBG 닉네임)은 **Host만** 입력·수정·삭제할 수 있다
- 닉네임은 팀당 최대 4개
- 닉네임과 Operator 슬롯은 독립적으로 관리된다

### 4.5 데이터 모델

**Team**

- teamId
- sessionId
- operatorUserId (대기석에서 배정 시 채워짐)
- status

**TeamMember** (닉네임 슬롯)

- memberId
- teamId
- playerNickname
- createdAt / updatedAt

**WaitingArea**

- sessionId
- userId
- joinedAt

### 4.6 팀 상태 모델

| 상태 | 조건 |
| --- | --- |
| EMPTY | Operator 없음, 닉네임 없음 |
| PARTIAL | Operator 또는 닉네임 중 하나만 있음 |
| READY | Operator 배정 + 닉네임 1개 이상 |

### 4.7 실시간 동기화 (WebSocket)

- 클라이언트는 세션 입장 시 WebSocket 연결
- 세션 단위 채널(room) 관리
- 대기석 변경, 팀 구성 변경, 닉네임 변경 모두 broadcast

---

## 5. Acceptance Criteria

- [ ]  세션에 2개 이상의 팀이 생성될 수 있다
- [ ]  각 팀은 닉네임 슬롯 최대 4개 + Operator 슬롯 1개를 가진다
- [ ]  로그인 사용자(Host 제외)는 세션 입장 시 대기석에 자동 배치된다
- [ ]  Host만 대기석 ↔ 팀 간 이동을 수행할 수 있다
- [ ]  팀으로 이동된 사용자는 해당 팀의 Operator로 자동 지정된다
- [ ]  Host도 한 팀의 Operator로 배정된다
- [ ]  닉네임 입력·수정·삭제는 Host만 가능하다
- [ ]  모든 변경사항은 1초 이내 실시간 반영된다

---

## 6. Edge Cases

- 팀 닉네임 4개 초과 입력 시도
- Operator 없는 팀으로 세션 시작 시도
- 동일 사용자를 여러 팀 Operator로 배정 시도
- 동일 팀 내 닉네임 중복 입력
- Host가 본인을 Operator 배정하지 않고 세션 시작 시도
- 대기석 사용자가 세션 이탈 시 처리
- 동시 이동 요청 (race condition)

---

## 7. Out of Scope

- 팀 자동 매칭
- 닉네임 검증 (PUBG API 연동)
- Operator의 닉네임 입력 권한
