# 백엔드 컨벤션 (Spring Boot / Java)

## 패키지 구조

도메인 중심으로 패키지를 구성한다.

```
com.[패키지명]/
├── domain/
│   ├── session/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── dto/
│   │   └── entity/
│   ├── score/
│   └── user/
├── global/
│   ├── config/
│   ├── exception/    # 커스텀 예외, ErrorCode enum
│   └── response/     # 공통 응답 포맷
└── infra/
    ├── ocr/          # 이미지 파싱 연동
    └── storage/      # 파일 업로드 연동
```

---

## Import 스타일

JDK·라이브러리·프레임워크가 제공하는 클래스는 최종 클래스명만 import한다. 구현부에서 패키지 경로를 직접 쓰지 않는다.

```java
// Bad
java.util.List<String> names = new java.util.ArrayList<>();

// Good
import java.util.List;
import java.util.ArrayList;
List<String> names = new ArrayList<>();
```

중첩 클래스(nested class)는 외부클래스.내부클래스 형태로 참조하지 않고, 직접 import해서 내부 클래스명만 사용한다.

```java
// Bad
if (match.getStatus() == Match.MatchStatus.CONFIRMED) { ... }

// Good
import com.killnagi.domain.match.entity.Match.MatchStatus;
if (match.getStatus() == MatchStatus.CONFIRMED) { ... }
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

## 길이 제한

읽기 어려운 코드의 주된 원인은 지나치게 긴 함수와 클래스다.
아래 기준을 초과하면 책임 분리가 필요하다는 신호로 받아들인다.

| 단위 | 최대 라인 | 초과 시 조치 |
|------|-----------|-------------|
| 함수 / 메서드 | 20줄 | 세부 동작을 private 메서드로 추출 |
| 클래스 | 200줄 | 책임 단위로 클래스 분리 |
| 파라미터 수 | 3개 | 4개 이상이면 별도 DTO로 묶기 |

```java
// Bad - 하나의 메서드가 너무 많은 일을 함
public ScoreBoard calculate(List<MatchResult> results, SessionRule rule, ...) {
    // 검증 로직 10줄
    // 킬 점수 계산 10줄
    // 순위 점수 계산 10줄
    // 집계 10줄
}

// Good - 역할별로 추출
public ScoreBoard calculate(List<MatchResult> results, SessionRule rule) {
    validate(results);
    List<MatchScore> scores = results.stream()
        .map(r -> toMatchScore(r, rule))
        .toList();
    return aggregate(scores);
}
```

---

## 디미터 법칙 (Law of Demeter)

"낯선 사람에게 말하지 마라." 객체는 직접 아는 객체에만 메시지를 보낸다.
체인이 길어질수록 내부 구조에 의존하게 되고, 변경에 취약해진다.

```java
// Bad - 내부 구조를 따라 3단계 이상 접근
int kills = session.getParticipant().getMatchResult().getKills();

// Good - 필요한 값을 직접 제공하는 메서드를 정의
int kills = session.getParticipantKills(participantId);
```

적용 기준: 메서드 체인이 `.` 2개를 초과하면 중간 객체에 위임 메서드를 추가하는 것을 검토한다.

### Tell, Don't Ask — 엔티티 상태 판단

서비스에서 엔티티의 내부 상태값을 꺼내 직접 비교하지 않는다.
상태 판단 책임은 엔티티에 있으며, 서비스는 엔티티에 의미 있는 질문만 던진다.

```java
// Bad - 서비스가 엔티티 내부 상태를 알아야 함
if (match.getStatus() == MatchStatus.PENDING) {
    throw KillnagiException.badRequest("...");
}

// Good - 엔티티가 상태 판단을 스스로 처리
// Match.java
public boolean isReflectable() {
    return this.status == MatchStatus.CONFIRMED;
}

// MatchReflectService.java
if (!match.isReflectable()) {
    throw KillnagiException.badRequest("...");
}
```

새로운 상태가 추가되더라도 서비스 코드는 건드리지 않고 엔티티 내부에서만 수정한다.

---

## DRY 원칙 (Don't Repeat Yourself)

동일한 로직이 2곳 이상에 등장하면 반드시 추출한다.
단, 코드가 비슷해 보여도 **의도가 다르면** 억지로 합치지 않는다.

```java
// Bad - 킬 점수 계산이 여러 곳에 흩어져 있음
// ScoreService.java
int killScore = match.getKills() * rule.getKillPoint();

// RankingService.java
int killScore = result.getKills() * sessionRule.getKillPoint(); // 중복

// Good - 계산 책임을 한 곳으로
public class ScoreCalculator {
    public int calculateKillScore(int kills, SessionRule rule) {
        return kills * rule.getKillPoint();
    }
}
```

공통 로직 위치 기준:
- 도메인 계산 → 해당 도메인 `service` 또는 별도 `Calculator` 클래스
- 문자열/날짜 등 범용 유틸 → `global/utils/`

---

## SOLID 원칙

### S - 단일 책임 (SRP)
하나의 클래스는 하나의 이유로만 변경된다.

```java
// Bad - 이미지 파싱 + 점수 계산 + 저장을 한 클래스가 담당
class MatchResultService {
    public void process(MultipartFile image) {
        MatchResult result = parseImage(image);   // 파싱
        ScoreBoard board = calculateScore(result); // 계산
        repository.save(board);                    // 저장
    }
}

// Good - 책임 분리
class MatchImageParser   { MatchResult parse(MultipartFile image) {...} }
class SessionScoreCalculator { ScoreBoard calculate(MatchResult r, SessionRule rule) {...} }
class ScoreBoardRepository   { void save(ScoreBoard board) {...} }
```

### O - 개방/폐쇄 (OCP)
새로운 기능은 기존 코드를 수정하지 않고 확장으로 추가한다.
SessionRule의 점수 방식이 바뀌어도 Calculator 코드를 직접 수정하지 않도록 인터페이스로 분리한다.

```java
public interface ScorePolicy {
    int calculate(MatchResult result);
}

public class KillBasedPolicy implements ScorePolicy { ... }
public class PlacementBasedPolicy implements ScorePolicy { ... }
```

### L - 리스코프 치환 (LSP)
하위 클래스는 상위 클래스를 완전히 대체할 수 있어야 한다.
상속보다 **조합(Composition)** 을 우선 검토한다.

### I - 인터페이스 분리 (ISP)
사용하지 않는 메서드를 강제하는 인터페이스는 분리한다.

```java
// Bad - 구현체가 필요 없는 메서드까지 강제
interface MatchService {
    MatchResult parse(MultipartFile image);
    ScoreBoard calculate(MatchResult result);
}

// Good - 역할별 분리
interface MatchParser     { MatchResult parse(MultipartFile image); }
interface ScoreCalculator { ScoreBoard calculate(MatchResult result); }
```

### D - 의존성 역전 (DIP)
구체 클래스가 아닌 인터페이스에 의존한다.
Spring의 `@Autowired` / 생성자 주입으로 DI를 활용한다. 생성자 주입을 기본으로 사용한다.

```java
// Bad - 구체 클래스에 직접 의존
private final GoogleVisionOcrClient ocrClient = new GoogleVisionOcrClient();

// Good - 인터페이스에 의존, 구현체는 주입
private final OcrClient ocrClient; // 생성자 주입
```

---

## 주석 작성 규칙

코드로 의도를 표현할 수 없을 때만 주석을 쓴다.
"무엇을"이 아니라 **"왜"** 를 설명한다.

```java
// Bad - 코드와 동일한 말을 반복
// 킬 수에 킬 포인트를 곱한다
int score = kills * killPoint;

// Good - 코드만으로 알 수 없는 맥락 설명
// 배그 공식 룰 기준: 팀킬은 킬 수에 포함되지 않으므로 별도 차감
int score = (kills - teamKills) * killPoint;
```

Javadoc은 `public` API (Controller, Service 인터페이스)에만 작성한다.
내부 private 메서드에는 작성하지 않는다.

---

## 매직 넘버 / 매직 스트링 금지

의미를 알 수 없는 리터럴은 반드시 상수로 추출한다.

```java
// Bad
if (file.getSize() > 10_485_760) { ... }
if (result.getPlacement() == 1) { ... }

// Good
private static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
private static final int FIRST_PLACE = 1;

if (file.getSize() > MAX_IMAGE_SIZE_BYTES) { ... }
if (result.getPlacement() == FIRST_PLACE) { ... }
```

상수 위치 기준:
- 해당 클래스에서만 쓰이면 → 해당 클래스 내 `private static final`
- 여러 클래스에서 쓰이면 → 도메인별 `constant` 클래스 또는 `global/constants/`

---

## null 처리 정책

`null` 반환과 `null` 체크를 지양한다. 의도를 명확히 표현하는 타입을 사용한다.

```java
// Bad - null 반환으로 호출부에 null 체크 책임 전가
public SessionRule findRule(Long sessionId) {
    return repository.findById(sessionId).orElse(null);
}

// Good - Optional로 부재 가능성을 타입으로 표현
public Optional<SessionRule> findRule(Long sessionId) {
    return repository.findById(sessionId);
}

// 컬렉션은 null 대신 빈 컬렉션 반환
public List<MatchResult> getResults(Long sessionId) {
    return repository.findBySessionId(sessionId); // 없으면 emptyList
}
```

규칙 요약:
- 단일 객체의 부재 → `Optional<T>` 반환
- 컬렉션의 부재 → `Collections.emptyList()` 또는 `List.of()` 반환
- 파라미터로 `null` 전달 금지 → 오버로딩 또는 별도 메서드로 분리

---

## 예외 처리

```java
// ErrorCode enum - 에러 코드와 메시지를 한 곳에서 관리
public enum ErrorCode {
    SCORE_CALCULATION_FAILED("점수 계산에 실패했습니다."),
    IMAGE_PARSE_FAILED("이미지 파싱에 실패했습니다."),
    IMAGE_SIZE_EXCEEDED("이미지 크기가 10MB를 초과했습니다."),
    INVALID_IMAGE_FORMAT("지원하지 않는 이미지 형식입니다.");
}
```

- 커스텀 예외는 `global/exception/` 하위에 정의
- `@RestControllerAdvice`로 전역 핸들링
- **예외를 잡고 아무것도 하지 않는 것 금지** — 최소한 로그를 남긴다
- 복구 불가능한 예외는 잡지 않고 상위로 전파한다

```java
// Bad - 예외를 삼킴
try {
    parseImage(file);
} catch (Exception e) { }

// Good - 비즈니스 예외로 전환 후 전파
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
- 슬라이스 테스트: `@WebMvcTest`, `@DataJpaTest` 적극 활용
- 파일명: `[클래스명]Test.java`
- 메서드명: 한국어로 `[상황]_[기대결과]` 형식

```java
@Test
void 킬수가_음수일때_예외를_던진다() { }

@Test
void 파일크기가_10MB_초과시_예외를_던진다() { }
```

### 구현 변경 시 테스트 자동 동기화

구현 코드가 변경되면 반드시 대응하는 테스트 파일을 함께 확인하고 반영한다.
사용자 지시 없이도 자동으로 수행한다.

대상 변경 유형:
- 메서드 시그니처 변경 (파라미터, 반환 타입)
- 상태 판단 방식 변경 (예: `getStatus() == X` → `isX()`)
- 검증 로직 추출 / 이동
- 예외 메시지 변경

```
구현 변경 → 해당 테스트 파일 열기 → 영향받는 테스트 확인 → 수정
```
