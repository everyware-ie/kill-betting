---
name: acceptance-test
description: 백엔드 서버 기준의 인수 테스트(Acceptance Test)를 작성할 때 지켜야 할 코딩 및 운영 모범 사례를 정의합니다.
---


# 백엔드 인수 테스트(Acceptance Test) Best Practice

## 문서 목적

인수 테스트는 시스템이 실제 비즈니스 요구사항을 충족하며 운영(Production) 환경에 배포 가능한 상태인지를 검증하는 것을 목표로 합니다.
따라서 테스트는 단순 구현 검증이 아니라, 사용자 관점의 시나리오와 비즈니스 흐름을 중심으로 작성되어야 합니다.

---

# 1. 인수 테스트의 목표

인수 테스트는 다음을 보장해야 합니다.

* 핵심 비즈니스 시나리오가 정상 동작한다.
* 시스템 간 연동이 실제 환경과 유사하게 동작한다.
* 운영 환경 배포 시 주요 기능이 깨지지 않는다.
* 요구사항과 구현 결과 간의 차이를 조기에 발견한다.

---

# 2. 핵심 작성 원칙

## 2.1 Given-When-Then 패턴 사용

인수 테스트는 BDD(Behavior-Driven Development) 스타일로 작성하여
테스트 자체가 하나의 요구사항 문서처럼 읽혀야 합니다.

### 구조

* **Given**: 초기 상태
* **When**: 사용자의 행동
* **Then**: 기대 결과

### 예시

```java
@Test
void 주문을_생성하면_결제가_승인된다() {
    // Given
    주문요청 request = 주문요청Builder.기본주문().build();

    // When
    주문응답 response = 주문을_생성한다(request);

    // Then
    assertThat(response.status()).isEqualTo(APPROVED);
}
```

### 권장 사항

* 테스트 메서드 이름은 비즈니스 문장처럼 작성
* 내부 구현보다 사용자 행동 중심으로 표현
* Arrange / Act / Assert 구조와 혼용 가능

---

## 2.2 구현 세부사항에 의존하지 않기

인수 테스트는 시스템의 내부 구현이 아니라 외부 계약(Contract)을 검증해야 합니다.

### 지양해야 할 예시

* private method 호출
* 내부 Repository 직접 검증
* 특정 클래스 구조 의존
* 내부 이벤트 발행 여부 검증

### 권장 방식

* HTTP API 호출
* 메시지 큐 소비 결과 확인
* DB 상태 최종 결과 검증
* 외부 관찰 가능한 결과 검증

### 좋은 예시

```java
// Bad
assertThat(orderRepository.findAll()).hasSize(1);

// Good
assertThat(response.status()).isEqualTo("COMPLETED");
```

---

## 2.3 테스트는 사용자 시나리오 중심으로 작성

테스트는 “기능 단위”보다 “업무 흐름 단위”로 작성합니다.

### 좋은 예시

* 회원 가입 → 로그인 → 주문 생성
* 결제 승인 → 재고 차감 → 배송 요청
* 쿠폰 발급 → 주문 적용 → 할인 검증

### 피해야 할 예시

* Service method 단독 호출 검증
* Mapper 변환 로직 검증
* 단일 Validator 검증

이러한 검증은 단위 테스트 책임에 가깝습니다.

---

## 2.4 Test Data Builder 사용

복잡한 테스트 데이터를 직접 하드코딩하지 않습니다.

Builder 패턴을 활용해 테스트 의도를 명확하게 표현합니다.

### 예시

```java
OrderRequest request = OrderRequestBuilder.anOrder()
    .withUserId(1L)
    .withProduct("Keyboard")
    .withQuantity(2)
    .build();
```

### 장점

* Arrange 단계 가독성 향상
* 중복 제거
* 기본값 재사용 가능
* 변경 대응 용이

---

# 3. API 기반 인수 테스트 권장 구조

백엔드 서버는 일반적으로 API 기반 인수 테스트를 권장합니다.

## 권장 테스트 레벨

| 테스트 종류                   | 목적          |
| ------------------------ | ----------- |
| 단위 테스트(Unit Test)        | 개별 로직 검증    |
| 통합 테스트(Integration Test) | 컴포넌트 연동 검증  |
| 인수 테스트(Acceptance Test)  | 사용자 시나리오 검증 |

---

## 권장 흐름

```text
Client
  ↓
HTTP API
  ↓
Application
  ↓
Database / External System
```

인수 테스트는 가능한 실제 사용자 접근 흐름과 동일하게 구성해야 합니다.

---

# 4. 테스트 데이터 전략

## 4.1 현실적인 데이터 사용

운영 환경과 유사한 데이터를 사용해야 실제 문제를 발견할 수 있습니다.

### 예시

* 실제 주문 건수 수준 데이터
* 긴 문자열
* 다국어 데이터
* 대량 데이터 처리
* 시간대(Timezone) 데이터

### 기대 효과

* 인코딩 문제 발견
* 성능 병목 조기 발견
* 데이터 변환 오류 탐지

---

## 4.2 테스트 독립성 유지

각 테스트는 독립적으로 실행 가능해야 합니다.

### 원칙

* 테스트 간 상태 공유 금지
* 순서 의존 금지
* 실행 전후 데이터 정리

### 예시

```java
@BeforeEach
void setUp() {
    databaseCleaner.clear();
}
```

---

# 5. 운영 환경과 유사한 환경 구성

인수 테스트는 가능한 Production과 유사한 환경에서 실행해야 합니다.

## 반드시 유사해야 하는 요소

* application configuration
* database engine/version
* external integrations
* message broker
* cache
* 데이터 규모

---

## 권장 사항

* Docker 기반 환경 구성
* 실제 외부 시스템 Sandbox 사용
* TestContainer 활용
* 운영과 동일한 DB 사용 권장

---

# 6. 핵심 경로(Happy Path) 우선 전략

인수 테스트는 모든 경우의 수를 검증하려고 하면 유지보수 비용이 급격히 증가합니다.

따라서 다음 우선순위를 권장합니다.

## 우선 자동화 대상

* 회원 가입
* 로그인
* 주문 생성
* 결제 승인
* 정산 처리
* 알림 발송

---

## 단위 테스트에 더 적합한 영역

* Null validation
* 예외 케이스 조합
* boundary value
* Mapper 변환
* utility method

---

# 7. 유지보수 가능한 테스트 코드 작성

## 7.1 중복 제거

반복되는 API 호출 로직은 Fixture 또는 Helper로 추출합니다.

### 예시

```java
주문응답 response = 주문_API.주문생성(request);
```

---

## 7.2 Assertion은 핵심만 검증

모든 필드를 검증하지 말고 비즈니스적으로 중요한 결과만 검증합니다.

### Bad

```java
assertThat(response.getCreatedAt()).isNotNull();
assertThat(response.getTraceId()).isNotNull();
```

### Good

```java
assertThat(response.status()).isEqualTo(COMPLETED);
```

---

## 7.3 HTTP 상태코드만으로 검증을 끝내지 않는다

HTTP 200/201 응답은 요청이 처리됐다는 의미일 뿐, 비즈니스 결과가 올바른지를 보장하지 않는다.
상태코드 검증은 보조 수단이며, 핵심은 **실제 상태 변화**를 검증하는 것이다.

### Bad — false positive 가능성

```java
// 플레이어가 실제로 추가됐는지 알 수 없다
assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
```

### Good — 행위 결과까지 검증

```java
플레이어를_추가한다(sessionId, teamId, "PlayerOne", hostToken);

ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
assertThat(parseBody(configure).at("/data/teams/0/players/0/nickname").asText())
    .isEqualTo("PlayerOne");
```

---

## 7.4 행위의 역방향도 검증한다

삭제·퇴장 등 제거 행위는 대상이 실제로 사라졌는지까지 검증해야 한다.
API 호출 성공만 확인하면 제거 로직이 무효화돼도 테스트를 통과한다.

### Bad

```java
delete("/api/sessions/" + sessionId + "/leave", participantToken);
assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
```

### Good

```java
delete("/api/sessions/" + sessionId + "/leave", participantToken);

ResponseEntity<String> configure = get("/api/sessions/" + sessionId + "/configure", hostToken);
assertThat(parseBody(configure).at("/data/waitingUsers").size()).isZero();
```

---

## 7.3 테스트는 읽기 쉬워야 함

테스트는 개발자가 아니라 “요구사항”을 설명하는 문서여야 합니다.

좋은 테스트는 다음 질문에 즉시 답할 수 있어야 합니다.

* 어떤 상황인가?
* 어떤 행동을 했는가?
* 무엇을 기대하는가?

---

# 8. 핵심 원칙 요약

| 실천 방법                | 기대 효과            |
| -------------------- | ---------------- |
| 선언적(Declarative) 스타일 | 사용자 의도 중심 테스트 가능 |
| 구현 세부사항 제거           | 리팩토링 내성 증가       |
| 현실적인 데이터 사용          | 운영 이슈 조기 발견      |
| 독립 실행 보장             | 안정적 CI 환경 구축     |
| 핵심 경로 우선 전략          | 유지보수 비용 절감       |
| 추적 가능성 확보            | 요구사항 커버리지 향상     |

---

# 결론

좋은 인수 테스트는 단순한 자동화 코드가 아니라,
비즈니스 요구사항을 실행 가능한 형태로 표현한 문서입니다.

따라서 다음 원칙을 지속적으로 유지해야 합니다.

* 사용자 시나리오 중심
* 구현 세부사항과 분리
* 운영 환경과 유사성 확보
* 유지보수 가능한 구조 유지
* 핵심 비즈니스 흐름 우선 검증

궁극적으로 인수 테스트의 목적은
“배포 가능한 품질 상태를 신뢰성 있게 보장하는 것”입니다.
