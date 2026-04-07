# 프론트엔드 컨벤션 (Next.js / React)

## 디렉토리 구조

```
frontend/src/
├── app/                   # App Router 페이지
│   ├── (auth)/
│   ├── session/
│   └── api/               # API Route
├── components/
│   └── ui/                # 순수 UI 컴포넌트 (버튼, 인풋 등)
├── features/              # 기능 단위 모듈
│   ├── session/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   └── score/
├── lib/
│   ├── api/               # 백엔드 API 클라이언트 함수
│   └── utils/
└── types/                 # 전역 타입 정의
```

---

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `ScoreBoard.tsx` |
| 훅 | camelCase + use 접두사 | `useSessionScore.ts` |
| 유틸 함수 | camelCase | `formatKillCount.ts` |
| 타입 / 인터페이스 | PascalCase | `MatchResult` |
| API 함수 | camelCase + 동사 | `uploadMatchResult()` |

---

## 상태 관리

- **서버 상태**: React Query (TanStack Query)
- **전역 클라이언트 상태**: Zustand
- **로컬 상태**: `useState`

서버에서 오는 데이터는 반드시 React Query로 관리하고, `useState`로 직접 관리하지 않는다.

---

## API 호출

`lib/api/` 하위에 도메인별 파일로 분리한다.

```ts
// lib/api/session.ts
export const uploadMatchResult = async (file: File): Promise<MatchResult> => { ... }
export const getScoreBoard = async (sessionId: string): Promise<ScoreBoard> => { ... }
```

컴포넌트에서 직접 fetch 호출 금지. 반드시 `lib/api/`를 통한다.

---

## 스타일

- **Tailwind CSS** 사용
- 인라인 스타일(`style={{}}`) 금지
- className이 길어지면 줄바꿈 허용

```tsx
// Good
<div
  className="flex flex-col items-center gap-4
             rounded-xl bg-gray-900 p-6"
>
```
