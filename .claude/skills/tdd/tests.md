# 좋은 테스트와 나쁜 테스트

## 좋은 테스트

**통합 스타일**: 내부 부분을 목킹하지 않고 실제 인터페이스를 통해 테스트한다.

```typescript
// 좋음: 관찰 가능한 동작을 테스트
test("유효한 장바구니로 결제할 수 있다", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

특징:

- 사용자/호출자가 신경 쓰는 동작을 테스트한다
- 공개 API만 사용한다
- 내부 리팩터링에도 살아남는다
- HOW가 아닌 WHAT을 설명한다
- 테스트당 하나의 논리적 단언

## 나쁜 테스트

**구현 세부사항 테스트**: 내부 구조에 결합되어 있다.

```typescript
// 나쁨: 구현 세부사항을 테스트
test("checkout이 paymentService.process를 호출한다", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

경고 신호:

- 내부 협력자 목킹
- 비공개 메서드 테스트
- 호출 횟수/순서 단언
- 동작 변경 없는 리팩터링에서 테스트 실패
- WHAT이 아닌 HOW를 설명하는 테스트 이름
- 인터페이스 대신 외부 수단으로 검증

```typescript
// 나쁨: 인터페이스를 우회해서 검증
test("createUser가 데이터베이스에 저장한다", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// 좋음: 인터페이스를 통해 검증
test("createUser로 생성한 유저를 조회할 수 있다", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```