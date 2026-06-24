# 프론트엔드 컨벤션 (Next.js / React)

> 기존 코드 수정 시 현재 패턴을 먼저 따른다. 새 기능 추가 시 [신규 기준]을 적용한다.

---

## 언어 & 구조

- 현재 `.js` (TypeScript 마이그레이션 전까지 유지)

```
frontend/
├── app/                   # App Router 페이지
├── components/ui/         # Button, Input 등 순수 UI
├── features/              # 기능 단위 모듈
│   └── [domain]/
│       ├── components/
│       ├── hooks/
│       └── helpers/
├── lib/
│   ├── api.js             # AuthAPI
│   ├── room-api.js        # RoomAPI
│   ├── auth-context.js
│   └── useWebSocket.js
└── mock/
```

---

## API 레이어

- 컴포넌트에서 `fetch` 직접 호출 금지. 반드시 `lib/api.js` 또는 `lib/room-api.js` 경유.
- 새 도메인 API → `lib/[domain]-api.js`로 분리.

### Mock 전환

```js
export const USE_MOCK = false; // true = 목 데이터
```

새 API 추가 시 Mock 분기 함께 작성:

```js
myApi: async (param) => {
  if (USE_MOCK) { await delay(300); return ok({ ... }); }
  return apiFetch('/endpoint', { method: 'POST', body: JSON.stringify({ param }) });
}
```

### 응답 포맷

모든 API 함수는 `{ success, data }` 또는 `{ success: false, error }` 반환.

```js
return ok({ id: '...' });   // { success: true, data: { id } }
return err('에러 메시지');   // { success: false, error: '...' }
```

호출부에서 반드시 `success` 체크:

```js
const res = await RoomAPI.get(roomCode);
if (!res.success) { setError(res.error); return; }
```

---

## 상태 관리

| 종류 | 현재 방식 | 신규 기준 |
|------|----------|----------|
| 서버 상태 | `useState` + `useEffect` | 여러 컴포넌트 공유 시 React Query 검토 |
| 전역 상태 | Context API | 유지 |
| 로컬 상태 | `useState` | 유지 |

같은 페이지 내에서 패턴 혼용 금지.

---

## 스타일

| 상황 | 규칙 |
|------|------|
| 기존 컴포넌트 수정 | 인라인 스타일 + CSS 변수 유지 |
| 신규 컴포넌트 | **Tailwind CSS** 사용, `style={{}}` 금지 |

테마 색상은 반드시 CSS 변수 사용. 하드코딩 금지.

| 변수 | 용도 |
|------|------|
| `var(--kn-bg)` | 배경 |
| `var(--kn-surface-1/2/3)` | 카드/패널 배경 |
| `var(--kn-text)` / `var(--kn-text-muted)` | 기본/보조 텍스트 |
| `var(--kn-accent)` | 강조색 |
| `var(--kn-success/danger)` | 상태색 |
| `var(--kn-border)` | 테두리 |

---

## 세션 상태값

```js
'WAITING'      // 대기 중 (setup)
'IN_PROGRESS'  // 진행 중 — 백엔드 기준
'LIVE'         // 진행 중 — 일부 API 응답 혼용
'ENDED'        // 종료 — 일부 API 응답
'DONE'         // 종료 — 일부 API 응답 혼용
```

> `IN_PROGRESS`/`LIVE`, `ENDED`/`DONE` 혼용됨. 두 값 모두 처리 필수:
> ```js
> if (status === 'IN_PROGRESS' || status === 'LIVE') { ... }
> if (status === 'ENDED' || status === 'DONE') { ... }
> ```

---

## 컴포넌트 규칙

### 크기 제한

| 단위 | 최대 |
|------|:----:|
| 페이지 컴포넌트 | 200줄 |
| 일반 컴포넌트 | 150줄 |
| 커스텀 훅 | 150줄 |

초과 시: 렌더링 조각 → 별도 컴포넌트, 서버 통신/상태 → 커스텀 훅으로 추출.

### 훅 추출

훅 위치: `features/[domain]/hooks/use[Feature].js`
페이지 컴포넌트는 훅 반환값 조합 + 렌더링만 담당.

### 파일 구조

```jsx
'use client'; // 필요한 경우에만

import { useState } from 'react';           // 1. 외부 라이브러리
import { RoomAPI } from '@/lib/room-api';   // 2. lib
import TeamCard from '../components/TeamCard'; // 3. features/components

export default function MyComponent({ prop1 }) { ... }
// 보조 컴포넌트는 파일 하단에 named export 없이 선언
```

### Props 패턴

```jsx
// 파라미터에서 바로 구조 분해. props.xxx 직접 접근 금지.
function TeamCard({ name, score, isLeader = false }) { ... }
```

기본값은 구조 분해 시 선언. 별도 `defaultProps` 금지.

### 조건부 렌더링

| 상황 | 방식 |
|------|------|
| show/hide | `&&` |
| 두 가지 선택 | 삼항 연산자 |
| 3가지 이상 | early return |

> `&&` 주의: 좌항이 숫자면 `0`이 렌더링된다.
> ```jsx
> {count > 0 && <Badge count={count} />}  // Good (boolean 변환)
> ```

### 리스트 렌더링

- `key`는 반드시 고유 ID. `index` 사용 금지.
- `map` 내부 JSX 3줄 이상 → 별도 컴포넌트로 추출.

### 이벤트 핸들러 네이밍

| 위치 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 내부 | `handleXxx` | `handleSubmit` |
| Props 콜백 | `onXxx` | `onSubmit` |

---

## useEffect 패턴

- 의존성 배열 생략 금지. ESLint `exhaustive-deps` 경고 무시 금지.
- 구독·타이머·fetch 취소 시 cleanup 반드시 반환.
- 하나의 `useEffect`에 여러 관심사 혼용 금지 — 관심사별로 분리.

```jsx
useEffect(() => {
  const timer = setInterval(pollStatus, 3000);
  return () => clearInterval(timer); // cleanup 필수
}, []);
```

---

## 에러 처리

- API 호출 후 반드시 `success` 체크. 에러는 상태로 관리 후 UI 노출.
- 에러를 삼키지 않는다.
- 새 요청 시작 시 이전 에러 초기화: `setError(null)`.

---

## 폼 처리

- 제어 컴포넌트(Controlled Component) 기본 사용.
- `onSubmit`에서 반드시 `e.preventDefault()` 호출.
- 여러 필드는 객체 상태로 묶기.

---

## WebSocket

```js
const { publish, connected } = useWebSocket(sessionId, (envelope) => {
  if (!envelope) return;
  if (envelope.type === 'SCORE_UPDATED') { ... }
}, !!sessionId); // enabled 조건 명시
```

- `connected` 상태로 연결 불안정 시 사용자에게 알릴 것.

---

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `TeamCard.js` |
| 훅 | `use` 접두사 + camelCase | `useSetupRoom.js` |
| 유틸/헬퍼 | camelCase | `mappers.js` |
| API 파일 | kebab-case + `-api` | `room-api.js` |
