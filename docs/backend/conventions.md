# 백엔드 컨벤션 (Spring Boot / Java)

---

## 패키지 구조

```
com.[패키지명]/
├── domain/
│   └── [도메인]/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── dto/
│       │   ├── request/
│       │   └── response/
│       └── entity/
├── global/
│   ├── config/
│   ├── exception/
│   └── response/
└── infra/
    ├── ocr/
    └── storage/
```

---

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스 | PascalCase | `SessionScoreService` |
| 메서드 / 변수 | camelCase | `calculateTotalScore()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_KILL_SCORE` |
| DB 테이블 / 컬럼 | snake_case | `session_result` |
| API 경로 | kebab-case | `/api/session-results` |

---

## Import 규칙

- JDK·라이브러리 클래스는 최종 클래스명만 import. 구현부에서 패키지 경로 직접 사용 금지.
- 중첩 클래스(Inner Class)는 외부 클래스 없이 직접 import해서 내부 클래스명만 사용.

```java
// Bad
if (match.getStatus() == Match.MatchStatus.CONFIRMED) { ... }

// Good
import com.killnagi.domain.match.entity.Match.MatchStatus;
if (match.getStatus() == MatchStatus.CONFIRMED) { ... }
```

---

## DTO

```
dto/
├── request/   → XxxRequest.java   (record 사용)
└── response/  → XxxResponse.java  (record 사용)
```

- 서비스 내부 클래스 형태(`TeamService.CreateTeamRequest`) 금지
- 불변 DTO는 `record`로 선언

---

## 코드 품질

### 길이 제한

| 단위 | 최대 | 초과 시 |
|------|:----:|---------|
| 메서드 | 20줄 | private 메서드 추출 |
| 클래스 | 200줄 | 책임 단위로 분리 |
| 파라미터 수 | 3개 | 별도 DTO로 묶기 |

### 디미터 법칙

메서드 체인이 `.` 2개 초과 시 중간 객체에 위임 메서드 추가.

```java
// Bad
int kills = session.getParticipant().getMatchResult().getKills();

// Good
int kills = session.getParticipantKills(participantId);
```

### Tell, Don't Ask

서비스에서 엔티티 내부 상태를 꺼내 직접 비교하지 않는다. 상태 판단은 엔티티 책임.

```java
// Bad
if (match.getStatus() == MatchStatus.PENDING) { throw ... }

// Good — Match.java에 판단 메서드 추가
if (!match.isReflectable()) { throw ... }
```

### DRY

동일 로직이 2곳 이상이면 추출. 단, 코드가 비슷해도 **의도가 다르면** 합치지 않는다.

- 도메인 계산 → 해당 도메인 `service` 또는 `Calculator` 클래스
- 범용 유틸 → `global/utils/`

---

## SOLID

| 원칙 | 핵심 규칙 |
|------|----------|
| **SRP** | 하나의 클래스는 하나의 이유로만 변경 |
| **OCP** | 새 기능은 기존 코드 수정 없이 확장으로 추가 — `ScorePolicy` 인터페이스로 분리 |
| **LSP** | 상속보다 조합(Composition) 우선 |
| **ISP** | 사용하지 않는 메서드를 강제하는 인터페이스는 분리 |
| **DIP** | 구체 클래스가 아닌 인터페이스에 의존. 생성자 주입을 기본으로 사용 |

---

## 주석

"무엇을"이 아닌 **"왜"** 만 설명. 코드로 표현 가능한 내용에는 주석 불필요.
Javadoc은 `public` API (Controller, Service 인터페이스)에만 작성.

---

## 매직 넘버 / 매직 스트링

의미를 알 수 없는 리터럴은 상수로 추출.

- 해당 클래스에서만 사용 → `private static final`
- 여러 클래스에서 사용 → `global/constants/` 또는 도메인별 `constant` 클래스

---

## null 처리

| 상황 | 처리 방식 |
|------|----------|
| 단일 객체 부재 | `Optional<T>` 반환 |
| 컬렉션 부재 | `Collections.emptyList()` 또는 `List.of()` |
| 파라미터 null 전달 | 금지 — 오버로딩 또는 별도 메서드 분리 |

---

## 예외 처리

```java
public enum ErrorCode {
    SCORE_CALCULATION_FAILED("점수 계산에 실패했습니다."),
    IMAGE_PARSE_FAILED("이미지 파싱에 실패했습니다."),
    ...
}
```

- 커스텀 예외 → `global/exception/`
- 전역 핸들링 → `@RestControllerAdvice`
- **예외를 잡고 아무것도 하지 않는 것 금지** — 최소 로그 남기기
- 복구 불가능한 예외는 잡지 않고 상위로 전파

```java
// Bad
try { parseImage(file); } catch (Exception e) { }

// Good
try {
    parseImage(file);
} catch (IOException e) {
    log.error("이미지 파싱 실패: {}", e.getMessage());
    throw new BusinessException(ErrorCode.IMAGE_PARSE_FAILED);
}
```

---

## 테스트

- 단위 테스트: JUnit5 + Mockito
- 슬라이스 테스트: `@WebMvcTest`, `@DataJpaTest`
- 파일명: `[클래스명]Test.java`
- 메서드명: 한국어 `[상황]_[기대결과]`

```java
@Test void 킬수가_음수일때_예외를_던진다() { }
@Test void 파일크기가_10MB_초과시_예외를_던진다() { }
```

구현 코드 변경 시 대응 테스트 파일을 반드시 함께 확인·반영한다.
