# CONTEXT.md 형식

## 구조

```md
# {컨텍스트 이름}

{이 컨텍스트가 무엇이고 왜 존재하는지 1-2문장 설명.}

## Language

**Order**:
{용어에 대한 1-2문장 설명}
_Avoid_: Purchase, transaction

**Invoice**:
배송 후 고객에게 발송하는 결제 요청.
_Avoid_: Bill, payment request

**Customer**:
주문을 하는 사람 또는 조직.
_Avoid_: Client, buyer, account
```

## 규칙

- **의견을 가질 것.** 같은 개념에 여러 단어가 있으면 가장 좋은 것을 하나 선택하고 나머지는 `_Avoid_`에 나열한다.
- **정의를 간결하게.** 최대 1-2문장. 무엇을 *하는지*가 아니라 무엇*인지*를 정의한다.
- **이 프로젝트 컨텍스트에 고유한 용어만 포함.** 일반적인 프로그래밍 개념(타임아웃, 에러 타입, 유틸리티 패턴)은 프로젝트에서 많이 쓰더라도 포함하지 않는다. 용어 추가 전에 "이것이 이 컨텍스트 고유의 개념인가, 아니면 일반적인 프로그래밍 개념인가?"를 자문한다. 전자만 포함한다.
- **자연스러운 클러스터가 생기면 소제목으로 그룹화.** 모든 용어가 하나의 영역에 속한다면 평탄한 목록도 괜찮다.

## 단일 컨텍스트 vs 멀티 컨텍스트 레포

**단일 컨텍스트 (대부분의 레포):** 레포 루트에 `CONTEXT.md` 하나.

**멀티 컨텍스트:** 루트의 `CONTEXT-MAP.md`가 각 컨텍스트와 그 위치, 상호 관계를 나열한다:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — 고객 주문을 수신하고 추적
- [Billing](./src/billing/CONTEXT.md) — 인보이스 생성 및 결제 처리
- [Fulfillment](./src/fulfillment/CONTEXT.md) — 창고 피킹 및 배송 관리

## Relationships

- **Ordering → Fulfillment**: Ordering이 `OrderPlaced` 이벤트를 발행; Fulfillment가 소비하여 피킹 시작
- **Fulfillment → Billing**: Fulfillment가 `ShipmentDispatched` 이벤트를 발행; Billing이 소비하여 인보이스 생성
- **Ordering ↔ Billing**: `CustomerId`와 `Money`에 대한 공유 타입
```

스킬은 어떤 구조인지 스스로 추론한다:

- `CONTEXT-MAP.md`가 있으면 읽어서 컨텍스트를 찾는다
- 루트 `CONTEXT.md`만 있으면 단일 컨텍스트
- 둘 다 없으면 첫 번째 용어가 확정될 때 루트 `CONTEXT.md`를 게으르게 생성한다

멀티 컨텍스트인 경우, 현재 주제가 어느 컨텍스트에 해당하는지 추론한다. 불명확하면 질문한다.
