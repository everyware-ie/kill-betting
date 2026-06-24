# 테스트 지침

---

## 전략

```
     [인수 테스트]        ← 최소, Cucumber + Gherkin
   [아키텍처 테스트]       ← 고정, ArchUnit
 [통합 테스트]             ← 적게, @SpringBootTest / @WebMvcTest / @DataJpaTest
[단위 테스트]              ← 많이, MockitoExtension
```

| 유형 | 도구 | TDD |
|------|------|:---:|
| 단위 (Service, Domain) | `@ExtendWith(MockitoExtension.class)` | ✅ 내부 루프 |
| 통합 (슬라이스 포함) | `@WebMvcTest` / `@DataJpaTest` / `@SpringBootTest` | ❌ |
| 아키텍처 | ArchUnit | ❌ |
| 인수 | Cucumber + Gherkin | ✅ 외부 루프 |

### ATDD 이중 루프

```
[외부 루프] Cucumber 시나리오 작성 (Red)
              ├─ [내부 루프] 단위 테스트 TDD (Red → Green → Refactor)
              └─ Cucumber (Green)
```

---

## 공통 규칙

- **Assertion**: AssertJ 사용. JUnit 5 기본 `Assertions` 지양.
- **@DisplayName**: 모든 테스트 클래스·메서드에 한국어로 작성.
- **격리**: 테스트 간 상태 공유 금지. 각 테스트는 독립 실행 가능해야 함.
- **@SpringBootTest 남용 금지**: 단위 테스트에 사용 금지.

### Fixture 패턴

테스트용 객체 생성은 Fixture 팩토리 함수 사용. 생성자 직접 호출 금지.

```
src/test/java/com/killnagi/support/fixture/
├── SessionFixture.java
└── MatchResultFixture.java
```

```java
public class SessionFixture {
    public static Session activeSession() { return Session.create(...); }
    public static Session endedSession() { ... }
    public static Session sessionWithTeamCount(int count) { ... }
}

// 사용
Session session = SessionFixture.activeSession();  // O
Session session = new Session(...);                // X
```

- `static` 메서드로 선언
- 클래스명: `{Domain}Fixture`
- `src/test/`에만 위치 (운영 코드 포함 금지)

---

## 단위 테스트

Spring 컨텍스트 없이 클래스 단위 검증. TDD 1순위 대상.

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("세션 점수 계산 서비스")
class SessionScoreServiceTest {

    @Mock SessionRepository sessionRepository;
    @InjectMocks SessionScoreService sessionScoreService;
}
```

- 외부 의존 → `@Mock`, 테스트 대상 → `@InjectMocks`
- `given(...).willReturn(...)` (BDDMockito 스타일)
- 도메인 객체(Entity, VO) 비즈니스 규칙도 단위 테스트로 검증 (Mock 불필요)

### 구조: Given / When / Then

```java
@Test
@DisplayName("킬 수가 0이면 킬 점수는 0이다")
void 킬수가_0이면_킬점수는_0이다() {
    // given
    MatchResult result = MatchResultFixture.withKills(0);

    // when
    int score = scoreService.calculateKillScore(result, rule);

    // then
    assertThat(score).isZero();
}
```

### @Nested

동일한 상황(given)을 공유하는 케이스를 그룹화:

```java
@Nested
@DisplayName("세션이 진행 중일 때")
class WhenInProgress {
    @Test @DisplayName("매치 결과를 반영할 수 있다") void ...
    @Test @DisplayName("추가 팀 참가가 불가능하다") void ...
}
```

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스 | `{TargetClass}Test` | `SessionScoreServiceTest` |
| 메서드 | 한국어 `{상황}_{기대결과}` | `킬수가_음수일때_예외를_던진다` |

---

## 통합 테스트

TDD 비대상. 단위 테스트로 핵심 로직 검증 후 보완적으로 작성.

**역할**: 인수 테스트로 커버되지 않는 엣지 케이스 (잘못된 헤더, 쿼리 정렬 정확성 등)

- 베이스 클래스에 애너테이션을 고정해 컨텍스트 공유 (`@MockitoBean`, `@DirtiesContext` 남용 금지)
- 테스트 간 DB 상태 공유 금지
- 동시성 테스트는 k6로 수행. `CountDownLatch` 방식 사용 금지.

| 클래스 | 규칙 | 예시 |
|------|------|------|
| 전체 통합 | `{기능}IntegrationTest` | `MatchResultIntegrationTest` |

---

## 인수 테스트 (Cucumber)

**핵심 원칙**: Cucumber는 API 테스트 도구가 아닌 **비즈니스 시나리오 명세 도구**다.
Feature 파일에 HTTP 상태코드·DB·메서드명이 등장하면 목적에서 벗어난 것.

**대상**: 사용자 가치가 있는 핵심 비즈니스 플로우, 여러 계층을 관통하는 시나리오
**비대상**: 단순 CRUD, Validation 세부 케이스, 예외 메시지 포맷

### 파일 구조

```
src/test/
├── java/com/killnagi/acceptance/
│   ├── AcceptanceTestBase.java
│   ├── AcceptanceTest.java
│   └── steps/
│       ├── SessionSteps.java
│       └── CommonSteps.java
└── resources/features/
    └── session/
        └── session_start.feature
```

### Feature 작성 규칙

```gherkin
Feature: 세션 시작

  Background:
    Given 팀이 구성된 세션이 존재한다

  Scenario: 호스트가 세션을 시작한다
    When 호스트가 세션 시작을 요청한다
    Then 세션이 진행 중 상태로 변경된다

  Scenario: 팀이 없으면 세션을 시작할 수 없다
    Given 팀이 없는 세션이 존재한다
    When 호스트가 세션 시작을 요청한다
    Then 세션 시작이 거부된다
```

- 한국어 작성 (비즈니스 가독성 우선)
- `Background`는 모든 시나리오에 필수적인 전제 조건만

### Step Definition 규칙

- `@Component`로 Spring Bean 등록
- 상태 **설정**은 API(HTTP)를 통해. Repository 직접 접근은 **검증 조회**에만 허용.
- 시나리오 내부 상태는 Step Definition 클래스 필드에 저장 (시나리오마다 객체 재생성됨)
- Feature 비즈니스 표현과 Step 메서드 제목을 일치시킴. 기술 세부사항은 내부에 숨김.

### 시나리오 격리

```java
@Component
public class CommonSteps {
    @Autowired MatchResultRepository matchResultRepository;

    @Before  // io.cucumber.java.Before (JUnit @BeforeEach 아님)
    public void cleanUp() {
        matchResultRepository.deleteAllInBatch();
    }
}
```

### 설정

```java
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AcceptanceTestBase {}

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.killnagi.acceptance")
public class AcceptanceTest {}
```

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| Feature 파일 | `{도메인}_{행위}.feature` | `session_start.feature` |
| Step Definition | `{Domain}Steps` | `SessionSteps` |

---

## 아키텍처 테스트 (ArchUnit)

레이어 의존 방향 위반을 빌드 단계에서 자동 검출. TDD 비대상.

```java
@AnalyzeClasses(packages = "com.killnagi")
class ArchitectureTest {

    @ArchTest
    static final ArchRule layerRule = layeredArchitecture()
            .consideringAllDependencies()
            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .layer("Repository").definedBy("..repository..")
            .layer("Domain").definedBy("..domain..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service")
            .whereLayer("Domain").mayOnlyBeAccessedByLayers("Service", "Repository");

    @ArchTest
    static final ArchRule domainNoDependencyOnSpring =
            noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework..")
                .as("Domain은 Spring에 의존하지 않는다");
}
```

- 새 레이어·의존 패턴 추가 시 ArchUnit 규칙도 함께 추가
- 각 규칙은 `.as("...")`로 한 줄 설명 필수
- 파일명: `ArchitectureTest` (고정)
