# 언제 목킹할까

**시스템 경계**에서만 목킹한다:

- 외부 API (결제, 이메일 등)
- 데이터베이스 (경우에 따라 — 테스트 DB를 선호)
- 시간/랜덤성
- 파일 시스템 (경우에 따라)

목킹하지 않을 것:

- 직접 만든 클래스/모듈
- 내부 협력자
- 직접 제어할 수 있는 모든 것

## 목킹 가능성을 위한 설계

시스템 경계에서 목킹하기 쉬운 인터페이스를 설계한다:

**1. 의존성 주입 사용**

외부 의존성을 내부에서 생성하지 말고 외부에서 주입받는다:

```typescript
// 목킹하기 쉬움
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// 목킹하기 어려움
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 범용 fetcher보다 SDK 스타일 인터페이스 선호**

조건부 로직이 있는 범용 함수 하나 대신, 각 외부 작업에 대한 구체적인 함수를 만든다:

```typescript
// 좋음: 각 함수를 독립적으로 목킹 가능
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// 나쁨: 목에 조건부 로직 필요
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 방식의 장점:
- 각 목이 하나의 구체적인 형태를 반환
- 테스트 설정에 조건부 로직 없음
- 테스트가 어떤 엔드포인트를 사용하는지 파악하기 쉬움
- 엔드포인트별 타입 안전성