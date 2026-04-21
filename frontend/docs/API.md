# Kill Challenge — 백엔드 API 명세서

> 이 문서는 프론트엔드(화면)와 백엔드(서버)를 연결할 때 백엔드 개발자가 참고하는 문서입니다.
> 기술적인 배경지식이 없어도 읽을 수 있도록 최대한 쉽게 작성했습니다.

---

## 목차

1. [핵심 개념 이해하기](#1-핵심-개념-이해하기)
2. [공통 규칙](#2-공통-규칙)
3. [데이터 구조](#3-데이터-구조)
4. [API 목록 — 인증](#4-api-목록--인증)
5. [API 목록 — 방 & 팀](#5-api-목록--방--팀)
6. [API 목록 — 매치 & 점수](#6-api-목록--매치--점수)
7. [실제 서버로 전환하는 방법](#7-실제-서버로-전환하는-방법)

---

## 1. 핵심 개념 이해하기

### 프론트엔드와 백엔드의 대화 방식

프론트엔드(화면)와 백엔드(서버)는 **API**라는 창구를 통해 대화합니다.
화면이 서버에게 "이 데이터 주세요" 혹은 "이 데이터 저장해주세요" 라고 요청하면,
서버는 결과를 돌려주는 방식입니다.

```
사용자가 [로그인] 버튼 클릭
    ↓
프론트엔드: "POST /auth/login { username: 'abc', password: '1234' }"
    ↓
백엔드: 유저 확인 → "{ ok: true, user: { id: '...', username: 'abc' } }"
    ↓
화면에 로그인 성공 표시
```

### 이 서비스에서 쓰이는 핵심 용어

| 용어 | 설명 |
|------|------|
| **방 (Room)** | 킬내기 게임 하나. 방장이 만들고 초대 코드로 팀원을 초대함 |
| **팀 (Team)** | 한 방 안의 팀. 기본 2팀(ALPHA / BRAVO), 최대 6팀 |
| **players** | 배틀그라운드 인게임 닉네임 목록. 계정과 무관하게 직접 입력하는 문자열 |
| **members** | 서비스에 로그인해서 방에 들어온 실제 유저 목록 |
| **OPERATOR** | 팀의 결과 입력 담당자. 팀당 반드시 1명. 나머지는 MEMBER |
| **매치 (Match)** | 배그 게임 1판. 팀마다 독립적으로 제출함 (A팀이 3판 하는 동안 B팀은 1판 할 수 있음) |
| **조정 (Adjustment)** | 운영자가 특정 팀 점수를 수동으로 가감하는 것 |

### 방의 상태 흐름

```
WAITING (대기 중)  →  LIVE (진행 중)  →  DONE (종료됨)
     ↑                    ↑                   ↑
  방 생성 시           킬내기 시작 시        경기 종료 시
```

---

## 2. 공통 규칙

### 기본 주소 (Base URL)

모든 API 주소 앞에 서버 주소를 붙입니다.

```
예시: https://api.killchallenge.com
```

프론트엔드 `.env` 파일에서 이 주소를 설정합니다:
```
NEXT_PUBLIC_API_URL=https://api.killchallenge.com
```

### 요청 형식

- 데이터를 보낼 때는 항상 **JSON 형식**으로 보냅니다.
- 요청 헤더에 반드시 아래를 포함해야 합니다:

```
Content-Type: application/json
```

### 로그인 유지 방식 (세션 쿠키)

로그인 상태는 **세션 쿠키**로 유지합니다.
프론트엔드는 모든 요청에 `credentials: 'include'` 옵션을 포함하고 있으므로,
백엔드에서 로그인 성공 시 `Set-Cookie` 헤더로 세션 쿠키를 발급하면 됩니다.

> **중요**: 백엔드 서버와 프론트엔드가 다른 도메인에 있다면 CORS 설정에서
> `Access-Control-Allow-Credentials: true`와 `Access-Control-Allow-Origin`을 정확히 설정해야 합니다.

### 응답 형식

**성공 시**
```json
{
  "ok": true,
  "데이터키": "값"
}
```

**실패 시**
```json
{
  "ok": false,
  "error": "실패 이유 메시지"
}
```

> 프론트엔드는 응답의 `ok` 값으로 성공/실패를 구분합니다.
> HTTP 상태 코드(200, 404 등)는 참고용이며, `error` 문자열을 화면에 직접 표시하므로
> **한국어로 사용자 친화적인 메시지**를 담아주세요.

---

## 3. 데이터 구조

API가 주고받는 주요 데이터의 생김새입니다.

### Room (방)

```json
{
  "id": "room-1234567890",
  "title": "4월 주말 킬내기",
  "code": "#4521-77",
  "status": "WAITING",
  "rule": { ... },
  "teams": [ ... ],
  "participants": [ ... ],
  "createdAt": "2024-04-08T14:30:00.000Z",
  "endedAt": null
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 방 고유 ID |
| `title` | string | 방 제목 |
| `code` | string | 초대 코드. 형식: `#0000-00` |
| `status` | string | `"WAITING"` / `"LIVE"` / `"DONE"` |
| `rule` | object | 킬내기 규칙 (아래 Rule 참고) |
| `teams` | array | 팀 목록 |
| `participants` | array | 로그인 유저 참여 목록 |
| `createdAt` | string | 생성 일시 (ISO 8601) |
| `endedAt` | string \| null | 종료 일시. 종료 전은 `null` |

---

### Rule (킬내기 규칙)

```json
{
  "gameMode": "스쿼드",
  "targetKills": 20,
  "timeLimitMin": 60,
  "noTimeLimit": false,

  "chickenBonusOn": true,
  "chickenBonus": 5,

  "headShotBonusOn": true,
  "headShotBonus": 2,

  "assistBonusOn": true,
  "assistBonus": 1,

  "teamKillPenaltyOn": true,
  "teamKillPenalty": 5,

  "deathPenaltyOn": false,
  "deathPenalty": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `gameMode` | string | `"솔로"` / `"듀오"` / `"스쿼드"` |
| `targetKills` | number | 목표 킬 수. 이 수에 도달하면 종료 안내 표시 |
| `timeLimitMin` | number | 제한 시간 (분 단위) |
| `noTimeLimit` | boolean | `true`이면 시간 제한 없음 |
| `chickenBonusOn` | boolean | 치킨(1등) 보너스 적용 여부 |
| `chickenBonus` | number | 치킨 시 추가 점수 |
| `headShotBonusOn` | boolean | 헤드샷 보너스 적용 여부 |
| `headShotBonus` | number | 헤드샷 1회당 추가 점수 |
| `assistBonusOn` | boolean | 어시스트 보너스 적용 여부 |
| `assistBonus` | number | 어시스트 1회당 추가 점수 |
| `teamKillPenaltyOn` | boolean | 팀킬 패널티 적용 여부 |
| `teamKillPenalty` | number | 팀킬 1회당 감점 |
| `deathPenaltyOn` | boolean | 조기 사망 패널티 적용 여부 |
| `deathPenalty` | number | 조기 사망 1회당 감점 |

---

### Team (팀)

```json
{
  "id": "team-alpha",
  "name": "TEAM ALPHA",
  "players": ["닉네임A", "닉네임B", "닉네임C", "닉네임D"],
  "members": [
    {
      "userId": "user-001",
      "username": "홍길동",
      "role": "OPERATOR"
    },
    {
      "userId": "user-002",
      "username": "김철수",
      "role": "MEMBER"
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 팀 고유 ID |
| `name` | string | 팀 이름 |
| `players` | string[] | 배틀그라운드 닉네임 목록. 문자열만 저장, 계정 연동 없음 |
| `members` | array | 로그인 유저 목록. `role`은 `"OPERATOR"` 또는 `"MEMBER"` |

> **players와 members의 차이**
> - `players`: 배그 인게임에서 직접 킬내기를 하는 사람의 닉네임. 서비스 가입 불필요.
> - `members`: 서비스에 가입하고 로그인해서 방에 들어온 사람. 결과 입력 등 방 운영을 담당.

---

### Match (매치 결과 1건)

```json
{
  "id": "match-1234567890",
  "teamId": "team-alpha",
  "teamMatchNumber": 3,
  "results": [
    {
      "nick": "닉네임A",
      "teamId": "team-alpha",
      "kills": 5,
      "damage": 1200,
      "headShot": true,
      "assist": false,
      "teamKills": 0,
      "earlyDeath": false
    }
  ],
  "chickenTeamId": null,
  "createdAt": "2024-04-08T15:00:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `teamId` | string | 이 결과를 제출한 팀의 ID |
| `teamMatchNumber` | number | 이 팀이 제출한 몇 번째 게임인지 (팀별 순번) |
| `results` | array | 팀 플레이어들의 개인 결과 목록 |
| `chickenTeamId` | string \| null | 치킨을 먹은 팀 ID. 못 먹었으면 `null` |

**results 안의 개인 결과 (PlayerResult)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `nick` | string | 배그 닉네임 |
| `kills` | number | 킬 수 |
| `damage` | number | 딜량 |
| `headShot` | boolean | 헤드샷 여부 (보너스 계산용) |
| `assist` | boolean | 어시스트 여부 (보너스 계산용) |
| `teamKills` | number | 팀킬 횟수 (패널티 계산용) |
| `earlyDeath` | boolean | 조기 사망 여부 (패널티 계산용) |

> **점수 계산 공식**
> ```
> 팀 총점 = 킬 합계 + 보너스 합계 − 패널티 합계 + 수동 조정값
> ```
> 점수 계산은 **프론트엔드**에서 직접 합니다. 서버는 원본 데이터만 저장하면 됩니다.

---

### Adjustment (점수 수동 조정)

```json
{
  "id": "adj-1234567890",
  "teamId": "team-alpha",
  "amount": -5,
  "reason": "서버 오류 보상",
  "createdAt": "2024-04-08T15:30:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `amount` | number | 조정 수치. 양수는 추가, 음수는 감점 |
| `reason` | string | 조정 사유 (운영자가 직접 입력) |

---

## 4. API 목록 — 인증

### 4-1. 현재 로그인 유저 조회

앱이 처음 열릴 때 이미 로그인된 유저인지 확인하기 위해 호출합니다.

```
GET /auth/me
```

**응답**
```json
// 로그인 상태일 때
{ "ok": true, "user": { "id": "user-001", "username": "홍길동" } }

// 로그인 안 됐을 때
{ "ok": false, "error": "로그인이 필요합니다" }
```

---

### 4-2. 로그인

```
POST /auth/login
```

**요청 본문 (Body)**
```json
{ "username": "honggildong", "password": "1234" }
```

**응답**
```json
// 성공
{ "ok": true, "user": { "id": "user-001", "username": "홍길동" } }

// 실패
{ "ok": false, "error": "존재하지 않는 아이디입니다" }
{ "ok": false, "error": "비밀번호가 올바르지 않습니다" }
```

> 로그인 성공 시 **세션 쿠키**를 응답 헤더에 포함해야 합니다 (`Set-Cookie`).

---

### 4-3. 회원가입

```
POST /auth/signup
```

**요청 본문**
```json
{ "username": "honggildong", "password": "1234" }
```

**응답**
```json
// 성공 (HTTP 201)
{ "ok": true, "user": { "id": "user-002", "username": "honggildong" } }

// 실패
{ "ok": false, "error": "이미 사용 중인 아이디입니다" }
{ "ok": false, "error": "아이디는 영문·숫자·언더스코어 2~20자만 가능합니다" }
{ "ok": false, "error": "비밀번호는 최소 4자 이상이어야 합니다" }
```

> 가입 성공 시 자동으로 로그인 처리합니다 (세션 쿠키 발급).

---

### 4-4. 로그아웃

```
POST /auth/logout
```

**응답**
```json
{ "ok": true }
```

> 세션 쿠키를 만료시켜주세요.

---

### 4-5. 내 프로필 상세 조회

마이페이지에서 가입일을 표시하기 위해 사용합니다.

```
GET /auth/profile
```

**응답**
```json
{
  "ok": true,
  "user": {
    "id": "user-001",
    "username": "홍길동",
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

---

### 4-6. 비밀번호 변경

```
PUT /auth/password
```

**요청 본문**
```json
{ "currentPassword": "기존비밀번호", "newPassword": "새비밀번호" }
```

**응답**
```json
// 성공
{ "ok": true }

// 실패
{ "ok": false, "error": "현재 비밀번호가 올바르지 않습니다" }
{ "ok": false, "error": "새 비밀번호는 최소 4자 이상이어야 합니다" }
```

---

### 4-7. 아이디 중복 확인

회원가입 화면에서 실시간 중복 체크에 사용합니다.

```
GET /auth/check-username?username=honggildong
```

**응답**
```json
// 사용 가능
{ "ok": true, "message": "사용 가능한 아이디입니다" }

// 사용 불가
{ "ok": false, "error": "이미 사용 중인 아이디입니다" }
{ "ok": false, "error": "영문·숫자·언더스코어만 사용 가능 (2~20자)" }
```

---

## 5. API 목록 — 방 & 팀

### 5-1. 방 만들기

```
POST /rooms
```

**요청 본문**
```json
{
  "title": "4월 주말 킬내기",
  "rule": {
    "gameMode": "스쿼드",
    "targetKills": 20,
    "timeLimitMin": 60,
    "noTimeLimit": false,
    "chickenBonusOn": true,
    "chickenBonus": 5,
    "headShotBonusOn": true,
    "headShotBonus": 2,
    "assistBonusOn": true,
    "assistBonus": 1,
    "teamKillPenaltyOn": true,
    "teamKillPenalty": 5,
    "deathPenaltyOn": false,
    "deathPenalty": 1
  }
}
```

**응답 (HTTP 201)**
```json
{
  "ok": true,
  "room": {
    "id": "room-001",
    "title": "4월 주말 킬내기",
    "code": "#4521-77",
    "status": "WAITING",
    "rule": { ... },
    "teams": [
      { "id": "team-alpha", "name": "TEAM ALPHA", "players": [], "members": [] },
      { "id": "team-bravo", "name": "TEAM BRAVO", "players": [], "members": [] }
    ],
    "participants": [
      { "userId": "user-001", "role": "HOST", "joinedAt": "2024-04-08T14:00:00Z" }
    ],
    "createdAt": "2024-04-08T14:00:00.000Z"
  }
}
```

> - 방 생성 시 기본 팀 2개(ALPHA, BRAVO)를 자동으로 만들어주세요.
> - 방을 만든 유저는 `participants`에 `role: "HOST"`로 자동 추가합니다.
> - `code`는 서버에서 `#0000-00` 형식으로 랜덤 생성합니다.

---

### 5-2. 방 조회

```
GET /rooms/:id
```

**응답**
```json
{ "ok": true, "room": { ... } }

{ "ok": false, "error": "방을 찾을 수 없습니다" }
```

---

### 5-3. 내 방 목록 조회

대시보드에서 내가 참여한 방 목록을 불러올 때 사용합니다.

```
GET /rooms?userId=user-001
```

> 로그인된 유저가 `participants`에 포함된 방만 반환합니다.
> 최신순(createdAt 내림차순)으로 정렬해주세요.

**응답**
```json
{
  "ok": true,
  "rooms": [
    {
      "id": "room-001",
      "title": "4월 주말 킬내기",
      "code": "#4521-77",
      "status": "LIVE",
      "rule": { ... },
      "teams": [ ... ],
      "createdAt": "2024-04-08T14:00:00.000Z"
    }
  ]
}
```

---

### 5-4. 초대 코드로 방 참여

대시보드에서 초대 코드를 입력하고 [참여] 버튼을 눌렀을 때 호출합니다.

```
POST /rooms/join
```

**요청 본문**
```json
{ "code": "#4521-77" }
```

**응답**
```json
// 성공 — 방 전체 정보를 반환
{ "ok": true, "room": { ... } }

// 실패
{ "ok": false, "error": "초대 코드를 찾을 수 없습니다" }
{ "ok": false, "error": "이미 종료된 방입니다" }
```

> - `#` 접두어 유무에 관계없이 처리해주세요 (`4521-77`과 `#4521-77`을 동일하게 취급).
> - 이미 참여 중인 유저가 다시 요청하면 에러 없이 방 정보만 반환합니다 (재접속 허용).
> - `DONE` 상태 방은 참여를 막아주세요.

---

### 5-5. 킬내기 시작

팀 구성 화면에서 [킬내기 시작] 버튼을 눌렀을 때 호출합니다.

```
POST /rooms/:id/start
```

**응답**
```json
// 성공 — status가 "LIVE"로 변경된 방 반환
{ "ok": true, "room": { ... } }

// 실패
{ "ok": false, "error": "TEAM ALPHA에 플레이어를 추가해주세요" }
```

> 각 팀의 `players`가 1명 이상이어야 시작할 수 있습니다.

---

### 5-6. 팀 합류 (로그인 유저가 팀 선택)

팀 구성 화면에서 [이 팀 합류] 버튼을 눌렀을 때 호출합니다.

```
POST /rooms/:id/teams/:teamId/join
```

**응답**
```json
{ "ok": true, "teams": [ ... ] }
```

> - 유저가 이미 다른 팀에 있으면 자동으로 기존 팀에서 빠지고 새 팀에 합류합니다.
> - 팀에 아무도 없으면 첫 합류자를 `OPERATOR`로 배정합니다.
> - 이미 `OPERATOR`가 있으면 `MEMBER`로 배정합니다.

---

### 5-7. 팀 나가기

```
POST /rooms/:id/teams/:teamId/leave
```

**응답**
```json
{ "ok": true, "teams": [ ... ] }
```

> `OPERATOR`가 나가면 남은 `members` 중 첫 번째가 자동으로 `OPERATOR`로 승격됩니다.

---

### 5-8. OPERATOR 위임

팀 내에서 결과 입력 권한을 다른 멤버에게 넘길 때 사용합니다.

```
PUT /rooms/:id/teams/:teamId/operator
```

**요청 본문**
```json
{ "userId": "위임받을유저ID" }
```

**응답**
```json
{ "ok": true, "teams": [ ... ] }
```

---

### 5-9. 팀 구성 업데이트 (플레이어 닉네임 추가/삭제)

배그 닉네임을 추가하거나 삭제할 때마다 호출합니다.

```
PUT /rooms/:id/teams
```

**요청 본문**
```json
{
  "teams": [
    {
      "id": "team-alpha",
      "name": "TEAM ALPHA",
      "players": ["닉네임A", "닉네임B"]
    },
    {
      "id": "team-bravo",
      "name": "TEAM BRAVO",
      "players": ["닉네임C"]
    }
  ]
}
```

**응답**
```json
{ "ok": true, "teams": [ ... ] }
```

> `players`는 **배그 닉네임 문자열의 배열**입니다. 계정 ID가 아닙니다.
> 팀 구성이 바뀔 때마다 전체 팀 배열을 덮어쓰는 방식입니다.

---

### 5-10. 팀 추가

팀 구성 화면에서 [+ 팀 추가] 버튼을 눌렀을 때 호출합니다.

```
POST /rooms/:id/teams
```

**응답**
```json
// 성공 — 새 팀이 추가된 전체 팀 목록 반환
{ "ok": true, "teams": [ ... ] }

// 실패
{ "ok": false, "error": "최대 6팀까지 가능합니다" }
```

> 팀 이름은 ALPHA → BRAVO → CHARLIE → DELTA → ECHO → FOXTROT 순서로 자동 부여합니다.

---

### 5-11. 룰 수정

팀 구성 화면 또는 라이브 진행 중 운영 메뉴에서 규칙을 수정할 때 호출합니다.

```
PUT /rooms/:id/rule
```

**요청 본문**
```json
{ "rule": { ... } }
```

**응답**
```json
{ "ok": true, "rule": { ... } }
```

---

### 5-12. 방 참여자 목록 조회

```
GET /rooms/:id/participants
```

**응답**
```json
{
  "ok": true,
  "participants": [
    { "userId": "user-001", "role": "HOST", "joinedAt": "2024-04-08T14:00:00Z" },
    { "userId": "user-002", "role": "MEMBER", "joinedAt": "2024-04-08T14:05:00Z" }
  ]
}
```

---

## 6. API 목록 — 매치 & 점수

### 6-1. 팀 매치 결과 제출

팀의 게임 1판이 끝났을 때 OPERATOR가 결과를 입력하고 제출합니다.

```
POST /rooms/:id/matches
```

**요청 본문**
```json
{
  "teamId": "team-alpha",
  "claimsChicken": false,
  "results": [
    {
      "nick": "닉네임A",
      "teamId": "team-alpha",
      "kills": 5,
      "damage": 1200,
      "headShot": true,
      "assist": false,
      "teamKills": 0,
      "earlyDeath": false
    },
    {
      "nick": "닉네임B",
      "teamId": "team-alpha",
      "kills": 2,
      "damage": 400,
      "headShot": false,
      "assist": true,
      "teamKills": 0,
      "earlyDeath": false
    }
  ]
}
```

**응답 (HTTP 201)**
```json
{
  "ok": true,
  "match": {
    "id": "match-001",
    "teamId": "team-alpha",
    "teamMatchNumber": 3,
    "results": [ ... ],
    "chickenTeamId": null,
    "createdAt": "2024-04-08T15:00:00.000Z"
  }
}
```

> **핵심 설계 원칙**: 각 팀은 완전히 독립적으로 결과를 제출합니다.
> A팀이 5판 하는 동안 B팀은 2판만 할 수도 있고, 순서도 상관없습니다.
>
> `teamMatchNumber`는 서버에서 계산해주세요:
> 해당 방에서 이 `teamId`로 이미 제출된 match 수 + 1

---

### 6-2. 매치 목록 조회

라이브 스코어보드가 5초마다 폴링하여 최신 결과를 가져옵니다.

```
GET /rooms/:id/matches
```

**응답**
```json
{
  "ok": true,
  "matches": [
    {
      "id": "match-001",
      "teamId": "team-alpha",
      "teamMatchNumber": 1,
      "results": [ ... ],
      "chickenTeamId": null,
      "createdAt": "2024-04-08T15:00:00.000Z"
    }
  ]
}
```

> 등록된 순서(오래된 것부터)로 반환해주세요.

---

### 6-3. 매치 결과 스크린샷 업로드

매치 결과 제출 후, 결과 입력에 사용한 스크린샷을 S3에 저장합니다.

```
POST /rooms/:id/matches/:matchId/screenshot
```

> **⚠️ 이 API는 JSON이 아닌 `multipart/form-data`로 전송합니다.**
> 프론트엔드가 `FormData`로 요청하므로 `Content-Type` 헤더를 수동 지정하지 마세요.
> 브라우저가 `multipart/form-data; boundary=...` 를 자동으로 설정합니다.

**요청 본문 (FormData)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `screenshot` | File | 업로드할 이미지 파일 (jpg, png 등) |

**응답**
```json
{
  "ok": true,
  "screenshotUrl": "https://s3.amazonaws.com/bucket/rooms/room-001/matches/match-001.png"
}
```

> - 반환된 `screenshotUrl`은 프론트엔드가 `match.screenshotUrl` 필드에 저장합니다.
> - 스크린샷이 있는 매치 항목은 히스토리에서 클릭 시 이미지 뷰어로 열립니다.
> - 매치 결과 저장(`POST /rooms/:id/matches`)과 별개 요청으로, 업로드 실패해도 매치 결과에는 영향 없습니다.

---

### 6-4. 점수 수동 조정

운영자가 특정 팀의 점수를 수동으로 가감합니다.

```
POST /rooms/:id/adjustments
```

**요청 본문**
```json
{
  "teamId": "team-alpha",
  "amount": -5,
  "reason": "서버 오류로 인한 게임 강제 종료"
}
```

**응답**
```json
{
  "ok": true,
  "adjustments": [
    {
      "id": "adj-001",
      "teamId": "team-alpha",
      "amount": -5,
      "reason": "서버 오류로 인한 게임 강제 종료",
      "createdAt": "2024-04-08T15:30:00.000Z"
    }
  ]
}
```

> `amount`가 양수이면 추가, 음수이면 감점입니다.
> 응답으로 이 방의 전체 조정 내역 목록을 반환해주세요.

---

### 6-4. 킬내기 종료

운영자가 경기를 종료합니다. `status`가 `"DONE"`으로 바뀝니다.

```
POST /rooms/:id/end
```

**응답**
```json
{
  "ok": true,
  "room": {
    "id": "room-001",
    "status": "DONE",
    "endedAt": "2024-04-08T16:00:00.000Z",
    ...
  }
}
```

---

## 7. 실제 서버로 전환하는 방법

현재 프론트엔드는 **Mock(가짜) 데이터**로 동작하고 있습니다.
실제 서버가 준비되면 아래 2가지만 변경하면 됩니다.

### Step 1 — API 주소 설정

프로젝트 루트에 `.env.local` 파일을 만들거나 편집합니다:

```
NEXT_PUBLIC_API_URL=https://api.killchallenge.com
```

### Step 2 — Mock 모드 해제

`lib/api.js` 파일 25번째 줄:

```js
// 변경 전
export const USE_MOCK = true;

// 변경 후
export const USE_MOCK = false;
```

이 두 가지만 바꾸면 프론트엔드의 모든 API 호출이 실제 서버로 연결됩니다.

---

### 전환 전 체크리스트

백엔드 개발자가 확인해야 할 항목입니다.

- [ ] 모든 API 엔드포인트가 위 명세대로 구현되어 있는가?
- [ ] 성공 응답에 `"ok": true`가 포함되어 있는가?
- [ ] 실패 응답에 `"ok": false`와 한국어 `"error"` 메시지가 있는가?
- [ ] 로그인/회원가입 시 세션 쿠키를 발급하는가?
- [ ] CORS 설정에서 프론트엔드 도메인이 허용되어 있는가?
- [ ] CORS 설정에서 `credentials: true`가 활성화되어 있는가?
- [ ] `POST /rooms/join`이 `#` 없이 입력된 코드도 정상 처리하는가?
- [ ] `POST /rooms/:id/matches`가 `teamMatchNumber`를 서버에서 자동 계산하는가?
- [ ] `GET /rooms/:id/matches`가 등록 순서대로 반환하는가?
- [ ] `GET /rooms?userId=`가 `participants`에 포함된 방만 반환하는가?

---

*최종 수정: 2026-04-19*
