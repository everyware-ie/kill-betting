# 프론트엔드 컨벤션 (Next.js / React)

> **현재 코드베이스 기준으로 작성됨.**
> 작은 수정 작업 시 기존 패턴을 먼저 따른다. 새 기능 추가 시 [신규 코드 기준]을 적용한다.

---

## 언어

- **현재**: `.js` (JavaScript)
- TypeScript 마이그레이션 전까지 `.js`로 유지

---

## 디렉토리 구조

```
frontend/
├── app/                   # App Router 페이지
│   ├── auth/
│   ├── room/[id]/
│   │   ├── page.js        # 상태 따라 setup/live/result로 리다이렉트
│   │   ├── setup/
│   │   ├── live/
│   │   └── result/
│   └── dashboard/
├── components/
│   └── ui/                # Button, Input, Icon 등 순수 UI
├── features/              # 기능 단위 모듈
│   └── setup/
│       ├── components/
│       ├── hooks/
│       └── helpers/
├── lib/
│   ├── api.js             # AuthAPI (인증 관련)
│   ├── room-api.js        # RoomAPI (방/세션 관련)
│   ├── auth-context.js
│   ├── theme-context.js
│   └── useWebSocket.js
└── mock/                  # 목 데이터 (USE_MOCK = true 시 사용)
```

---

## API 레이어

### 기본 규칙
- 컴포넌트에서 `fetch` 직접 호출 금지. 반드시 `lib/api.js` 또는 `lib/room-api.js`를 통한다.
- 새 도메인 API는 `lib/[domain]-api.js` 파일로 분리한다.

### Mock / 실제 API 전환
`lib/api.js`의 `USE_MOCK` 플래그로 전환한다.
```js
export const USE_MOCK = false; // true = 목 데이터, false = 실제 API
```

새 API 함수 추가 시 반드시 Mock 분기를 함께 작성한다:
```js
myApi: async (param) => {
  if (USE_MOCK) {
    await delay(300);
    return ok({ ... });
  }
  return apiFetch('/api/endpoint', { method: 'POST', body: JSON.stringify({ param }) });
}
```

### 응답 포맷
모든 API 함수는 `{ success, data }` 또는 `{ success: false, error }` 형태로 반환한다.
```js
// 성공
return ok({ id: '...', name: '...' });   // → { success: true, data: { id, name } }

// 실패
return err('에러 메시지');               // → { success: false, error: '에러 메시지' }
```

호출부에서 반드시 `success` 여부를 체크한다:
```js
const res = await RoomAPI.get(roomCode);
if (!res.success) { setError(res.error); return; }
const room = res.data;
```

### apiFetch
`apiFetch`는 `api.js`와 `room-api.js`에 각각 정의되어 있다 (현재 중복 상태).
새 API 파일 추가 시 `room-api.js`의 `apiFetch`를 그대로 복사해서 쓴다.

---

## 상태 관리

### 현재 방식 (기존 코드 유지)
- **서버 상태**: `useState` + `useEffect` (React Query 미도입)
- **전역 상태**: Context API (`auth-context`, `theme-context`)
- **로컬 상태**: `useState`

### 신규 코드 기준
- 서버 상태가 여러 컴포넌트에서 공유되는 경우 React Query 도입을 검토한다.
- 기존 패턴과 새 패턴을 혼용하지 않는다. 같은 페이지 내에서 일관성 유지.

---

## 스타일

### 현재 방식 (기존 코드 유지)
기존 코드는 인라인 스타일 + CSS 변수(`var(--kn-*)`)를 혼용한다.
기존 컴포넌트 수정 시 같은 방식을 따른다.

```jsx
// 기존 컴포넌트 수정 시 — 인라인 스타일 유지
<div style={{ fontSize: 13, color: 'var(--kn-text-muted)' }}>...</div>
```

### 신규 컴포넌트 기준
새로 만드는 컴포넌트는 **Tailwind CSS**를 우선 사용한다.
인라인 스타일(`style={{}}`) 금지.

```jsx
// 신규 컴포넌트
<div className="text-sm text-muted flex items-center gap-2">...</div>
```

### CSS 변수 (테마)
테마 색상은 반드시 CSS 변수를 사용한다. 하드코딩 금지.

| 변수 | 용도 |
|------|------|
| `var(--kn-bg)` | 배경 |
| `var(--kn-surface-1/2/3)` | 카드/패널 배경 |
| `var(--kn-text)` | 기본 텍스트 |
| `var(--kn-text-muted)` | 보조 텍스트 |
| `var(--kn-accent)` | 강조색 |
| `var(--kn-success/danger)` | 상태색 |
| `var(--kn-border)` | 테두리 |

---

## 세션 상태값

세션 상태는 아래 문자열 리터럴을 사용한다. 직접 문자열 비교 시 오타 주의.

```js
'WAITING'      // 세션 대기 중 (setup 화면)
'IN_PROGRESS'  // 진행 중 (live 화면) — 백엔드 기준
'LIVE'         // 진행 중 (live 화면) — 일부 API 응답에서 혼용
'ENDED'        // 종료됨 — 일부 API 응답에서 사용
'DONE'         // 종료됨 — 일부 API 응답에서 혼용
```

> `IN_PROGRESS`/`LIVE`, `ENDED`/`DONE`이 혼용됨. 상태 체크 시 두 값 모두 처리할 것:
> ```js
> if (status === 'IN_PROGRESS' || status === 'LIVE') { ... }
> if (status === 'ENDED' || status === 'DONE') { ... }
> ```

---

## 훅 추출 규칙

페이지 로직이 복잡해지면 반드시 커스텀 훅으로 추출한다.

```
app/room/[id]/setup/page.js  →  features/setup/hooks/useSetupRoom.js (완료)
```

훅 파일 위치: `features/[domain]/hooks/use[Feature].js`

페이지 컴포넌트는 훅에서 반환된 값과 핸들러를 조합해 렌더링만 담당한다.

---

## 컴포넌트 크기 제한

| 단위 | 최대 라인 |
|------|---------|
| 페이지 컴포넌트 | 200줄 |
| 일반 컴포넌트 | 150줄 |
| 커스텀 훅 | 150줄 |

초과 시:
- 렌더링 조각 → 별도 컴포넌트로 추출 (`features/[domain]/components/`)
- 서버 통신/상태 로직 → 커스텀 훅으로 추출

> `live/page.js`는 현재 1000줄 초과 상태 (기술 부채). 신규 작성 파일에서 이 패턴을 따르지 말 것.

---

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `TeamCard.js` |
| 훅 | camelCase + use 접두사 | `useSetupRoom.js` |
| 유틸/헬퍼 | camelCase | `mappers.js` |
| API 파일 | kebab-case + `-api` 접미사 | `room-api.js` |

---

## WebSocket

`lib/useWebSocket.js`를 통해 WebSocket을 사용한다.

```js
const { publish, connected } = useWebSocket(sessionId, (envelope) => {
  if (!envelope) return;
  if (envelope.type === 'SCORE_UPDATED') { ... }
}, !!sessionId); // 세 번째 인자: enabled 조건
```

- `sessionId`가 확정된 후에 연결되도록 `enabled` 조건을 명시한다.
- `connected` 상태를 활용해 연결 불안정 시 사용자에게 알린다.

---

## 컴포넌트 파일 구조

파일 내 선언 순서를 일관되게 유지한다.

```jsx
'use client'; // Next.js — 서버 컴포넌트가 기본. 필요한 경우에만 명시.

// 1. 외부 라이브러리
import { useState, useEffect, useCallback } from 'react';

// 2. 내부 모듈 (lib → features → components 순)
import { RoomAPI } from '@/lib/room-api';
import TeamCard from '../components/TeamCard';

// 컴포넌트 선언: named function + default export
export default function MyComponent({ prop1, prop2 }) {
  // ...
}
```

- `export default`는 파일 하단이 아닌 **함수 선언부에 함께** 붙인다.
- 보조 컴포넌트(같은 파일 내 작은 컴포넌트)는 파일 **하단**에 named export 없이 선언한다.

---

## Props 패턴

### 구조 분해

Props는 파라미터에서 바로 구조 분해한다. `props.xxx` 직접 접근 금지.

```jsx
// Bad
function TeamCard(props) {
  return <div>{props.name}</div>;
}

// Good
function TeamCard({ name, score, isLeader = false }) {
  return <div>{name}</div>;
}
```

### 기본값

기본값은 구조 분해 시 선언한다. 별도 defaultProps 선언 금지.

```jsx
function Button({ label, disabled = false, variant = 'primary' }) { ... }
```

---

## 조건부 렌더링

### `&&` vs 삼항 연산자 기준

| 상황 | 방식 |
|------|------|
| 단순 show/hide | `&&` |
| 두 가지 중 하나 선택 | 삼항 연산자 |
| 3가지 이상 분기 | early return 또는 별도 컴포넌트 |

```jsx
// show/hide
{isLoaded && <ScoreBoard data={scores} />}

// 두 가지 선택
{isLeader ? <UploadButton /> : <WaitingMessage />}

// 3가지 이상 — 조기 반환
if (status === 'LOADING') return <Spinner />;
if (status === 'ERROR') return <ErrorMessage error={error} />;
return <Content />;
```

> `&&` 사용 시 주의: 좌항이 숫자면 `0`이 렌더링된다. 반드시 boolean으로 변환할 것.
> ```jsx
> // Bad — count가 0이면 "0" 렌더링
> {count && <Badge count={count} />}
>
> // Good
> {count > 0 && <Badge count={count} />}
> ```

---

## 리스트 렌더링

- `key`는 반드시 **고유 ID**를 사용한다. `index` 사용 금지.
- `map` 내부 JSX가 3줄 이상이면 별도 컴포넌트로 추출한다.

```jsx
// Bad — index를 key로 사용 (정렬/필터 시 버그 발생)
{teams.map((team, i) => <TeamCard key={i} team={team} />)}

// Good
{teams.map((team) => <TeamCard key={team.id} team={team} />)}
```

---

## 이벤트 핸들러 네이밍

| 위치 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 내부 함수 | `handleXxx` | `handleSubmit`, `handleDelete` |
| Props로 넘기는 콜백 | `onXxx` | `onSubmit`, `onDelete` |

```jsx
// 내부 핸들러
function handleSubmit() {
  // ...
}

// Props 정의
function Form({ onSubmit }) { ... }

// 사용
<Form onSubmit={handleSubmit} />
```

---

## useEffect 패턴

### 의존성 배열

- 의존성 배열 생략 금지 (무한 루프 또는 stale closure 원인).
- ESLint `exhaustive-deps` 경고를 무시하지 않는다.

```jsx
// Bad — 의존성 누락
useEffect(() => {
  fetchSession(sessionId);
}, []); // sessionId가 바뀌어도 재실행 안 됨

// Good
useEffect(() => {
  fetchSession(sessionId);
}, [sessionId]);
```

### Cleanup

구독, 타이머, fetch 취소가 필요한 경우 반드시 cleanup을 반환한다.

```jsx
useEffect(() => {
  const timer = setInterval(pollStatus, 3000);
  return () => clearInterval(timer); // cleanup 필수
}, []);
```

### 관심사 분리

하나의 `useEffect`에 여러 관심사를 섞지 않는다. 관심사별로 분리한다.

```jsx
// Bad — 데이터 로딩과 타이머를 한 effect에
useEffect(() => {
  fetchSession();
  const timer = setInterval(poll, 3000);
  return () => clearInterval(timer);
}, []);

// Good — 분리
useEffect(() => { fetchSession(); }, [sessionId]);
useEffect(() => {
  const timer = setInterval(poll, 3000);
  return () => clearInterval(timer);
}, []);
```

---

## 에러 처리

### API 에러

API 호출 후 반드시 `success` 체크. 에러는 상태로 관리하고 UI에 노출한다.

```jsx
const [error, setError] = useState(null);

async function handleJoin() {
  const res = await RoomAPI.join(roomCode);
  if (!res.success) {
    setError(res.error); // 에러를 삼키지 않는다
    return;
  }
  router.push(`/room/${res.data.id}`);
}

// 렌더링
{error && <p className="text-danger">{error}</p>}
```

### 에러 상태 초기화

새 요청 시작 시 이전 에러를 초기화한다.

```jsx
async function handleSubmit() {
  setError(null); // 이전 에러 초기화
  const res = await API.submit(data);
  // ...
}
```

---

## 폼 처리

제어 컴포넌트(Controlled Component)를 기본으로 사용한다.

```jsx
const [nickname, setNickname] = useState('');

// value + onChange 쌍으로 관리
<input
  value={nickname}
  onChange={(e) => setNickname(e.target.value)}
/>
```

- `onSubmit`에서 반드시 `e.preventDefault()` 호출.
- 여러 필드는 객체 상태로 묶는다.

```jsx
const [form, setForm] = useState({ name: '', code: '' });

function handleChange(e) {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
}

function handleSubmit(e) {
  e.preventDefault();
  // form.name, form.code 사용
}
```

---

## 참고 문서

- API 스펙: `frontend/docs/API.md`
- 화면별 기능 정의: `frontend/docs/00-overview.md` ~ `09-mypage.md`
- 도메인 용어: `@.claude/domain/glossary.md`