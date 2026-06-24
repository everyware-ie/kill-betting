# 아키텍처 규칙

## 스타일

**Modular Monolith** — 단일 배포 단위, 내부는 도메인 모듈로 경계 분리.
모듈 경계는 ArchUnit 테스트로 강제한다.

---

## 패키지 구조

```
com.killnagi/
├── domain/
│   ├── session/    ← 세션 관리
│   ├── match/      ← 매치 결과
│   ├── team/       ← 팀 구성
│   ├── scoreboard/ ← 점수 집계
│   ├── rule/       ← 세션 룰
│   └── user/       ← 사용자
├── common/         ← 모든 모듈에서 접근 가능
│   ├── response/
│   ├── exception/
│   ├── security/
│   ├── storage/
│   └── logging/
├── global/
│   └── config/
└── infra/
    └── ocr/
```

---

## 모듈 경계 규칙

- 다른 모듈의 하위 패키지(controller, service 등)에 직접 접근 금지
- 모듈 간 통신은 모듈 루트 패키지의 public 클래스(인터페이스)를 통해서만
- `common` 패키지는 예외 — 모든 모듈에서 접근 가능

---

## 레이어 의존 방향

```
controller ──→ service ──→ repository ──→ domain
     │            │
     └──→ dto ←───┘
```

- `controller` → `service`, `dto`
- `service` → `repository`, `domain`, `dto`
- `repository` → `domain`
- `domain` → (없음)
- 단방향만 허용. 역방향 금지.
- `domain`은 어떤 레이어에도 의존하지 않는다.

레이어별 세부 지침 → `docs/backend/layers.md`

---

## ArchUnit

- 레이어 의존 방향 규칙과 모듈 경계 규칙을 테스트로 명세한다.
- 위치: `src/test/java/com/killnagi/architecture/ArchitectureTest.java`

---

## 예외 처리

### 예외 계층 구조

```
RuntimeException
└── BusinessException   ← 도메인 규칙 위반 (의도된 예외)
```

- 모든 도메인 예외는 `BusinessException`을 직접 사용한다.
- `BusinessException`은 `HttpStatus`와 메시지를 필드로 가진다.

```java
throw new BusinessException("존재하지 않는 세션입니다.", HttpStatus.NOT_FOUND);
```

### GlobalExceptionHandler

| 예외 타입 | HTTP 상태 | 비고 |
|-----------|-----------|------|
| `BusinessException` | `exception.getStatus()` | 도메인 예외 |
| `MethodArgumentNotValidException` | 400 | Bean Validation 실패 |
| `Exception` (미처리) | 500 | 상세 내용 클라이언트에 노출 금지 |

### 로깅 및 예외 변환

- `BusinessException`: `WARN` 수준으로 로깅 (예상 가능한 예외)
- 미처리 예외: `ERROR` + stack trace
- Service는 `BusinessException`만 던진다. JPA 등 인프라 예외는 Service에서 `BusinessException`으로 변환한다.
