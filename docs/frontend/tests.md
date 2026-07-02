# 프론트엔드 테스트 전략

모든 코드에 테스트를 작성하는 것은 비효율적이다.
**핵심 비즈니스 로직**과 **반복적으로 이슈가 발생하는 기능** 위주로 점진적으로 도입한다.

---

## 도구 스택

| 레이어 | 도구 | 용도 |
|--------|------|------|
| 유닛 / 통합 | Vitest + MSW | 유틸 함수, 훅, API 응답 처리 |
| E2E | Playwright | 페이지 이동, 폼 제출, UI 상호작용 |

---

## 1. 유닛 / 통합 테스트 (Vitest + MSW)

네트워크 응답 변화나 복잡한 계산 로직을 다루는 유틸리티 함수에 적합하다.

```js
// helpers/scoreHelpers.test.js
import { describe, it, expect } from 'vitest';
import { calculateTotalScore } from './scoreHelpers';

describe('세션 점수 계산', () => {
  it('킬 3개 + 순위 2위일 때 점수를 올바르게 합산한다', () => {
    const result = calculateTotalScore({ kills: 3, placement: 2, rule });
    expect(result).toBe(expected);
  });
});
```

### 파일 위치

테스트 파일은 소스 파일과 같은 폴더에 배치한다 (응집형).
기능(도메인) 단위로 폴더를 묶고, 그 아래 테스트를 함께 둔다.

```
features/
└── [domain]/
    ├── components/
    │   ├── TeamCard.js
    │   └── TeamCard.test.js
    ├── hooks/
    │   ├── useScoreBoard.js
    │   └── useScoreBoard.test.js
    └── helpers/
        ├── scoreHelpers.js
        └── scoreHelpers.test.js
```

E2E 테스트는 페이지를 관통하는 시나리오이므로 `frontend/e2e/`에 분리한다:

```
e2e/
└── session_start.spec.js
```

### MSW로 API 목킹

컴포넌트 / 훅이 API 응답에 의존하는 경우, MSW로 네트워크 레이어를 가로챈다.
`lib/[domain]-api.js`의 `fetch` 호출을 직접 목킹하지 않는다.

> `conventions.md`의 `USE_MOCK`과 MSW는 다른 개념이다.
> `USE_MOCK`은 개발 중 수동으로 앱 수준에서 응답을 대체하는 플래그이고,
> MSW는 테스트 실행 중에만 네트워크를 인터셉트하는 도구다. 둘은 독립적으로 동작한다.

```js
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/sessions/:id/scoreboard', () => {
    return HttpResponse.json({ teams: [...] });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 2. E2E 테스트 (Playwright)

사용자 관점에서 페이지 이동, 폼 제출, UI 상호작용이 올바르게 동작하는지 검증한다.

```js
import { test, expect } from '@playwright/test';

test('호스트가 세션을 시작하면 LIVE 화면으로 이동한다', async ({ page }) => {
  await page.goto('http://localhost:3000/room/test-session-id');

  await page.click('button:has-text("세션 시작")');

  await expect(page).toHaveURL(/\/live/);
  await expect(page.locator('text=진행 중')).toBeVisible();
});
```

### E2E 대상 기준

| 포함 | 제외 |
|------|------|
| 핵심 플로우 (세션 생성 → 시작 → 결과) | 단순 렌더링 확인 |
| 여러 페이지를 관통하는 시나리오 | Validation 세부 케이스 |
| WebSocket 상태 반영 | 에러 메시지 포맷 |

---

## AI 시대의 테스트 접근

2026년 현재, 많은 프론트엔드 코드가 AI로 생성된다. 이 환경에서 테스트의 역할이 달라진다.

- **TDD 활용**: AI에게 코드를 생성하게 한 뒤, Vitest로 요구사항을 충족하는지 즉시 검증한다.
- **엣지 케이스 검증**: 복잡한 사용자 상호작용 상황에서 발생할 수 있는 잠재적 버그를 AI에게 물어보고, 해당 테스트 코드를 작성한다.
- **회귀 방지망**: AI가 리팩터링한 코드가 기존 동작을 깨뜨리지 않는지 확인하는 용도로 테스트를 활용한다.

---

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 유닛 테스트 파일 | `{파일명}.test.js` | `scoreHelpers.test.js` |
| E2E 테스트 파일 | `{도메인}_{행위}.spec.js` | `session_start.spec.js` |
| 테스트 설명 | 한국어, 동작 중심 | `'킬 0개이면 킬 점수는 0이다'` |