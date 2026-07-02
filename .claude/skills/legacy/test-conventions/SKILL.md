---
name: test-conventions
description: killnagi 프로젝트의 테스트 코드 작성 컨벤션. 테스트 코드를 새로 작성하거나 리뷰할 때 호출. "테스트 작성해줘", "테스트 코드 리뷰해줘", "테스트 컨벤션 확인해줘" 등에 반응한다.
---

# killnagi 테스트 작성 규칙

테스트를 작성하기 전에 이 규칙을 먼저 읽는다. 규칙을 어기는 테스트는 작성하지 않는다.

---

## 1. 메서드 네이밍

```java
// Good - 한국어, [상황]_[기대결과] 형식
@Test
void 존재하지_않는_유저가_세션_생성시_예외가_발생한다() { }

// Good - 도메인 상수(enum, 상태값)는 영어 허용
@Test
void PENDING_상태의_매치는_확정할_수_없다() { }

// Bad - 영어 메서드명
@Test
void should_ThrowException_when_UserNotFound() { }

// Bad - 영어+한국어 혼합 (메서드명 앞에 영어)
@Test
void addKills_호출시_totalKills가_누적된다() { }
```

## 2. @DisplayName 규칙

```java
// Good - 클래스 레벨에만 허용
@DisplayName("SessionService 세션 관리 테스트")
class SessionServiceTest { }

// Bad - 메서드 레벨 사용 금지
@Test
@DisplayName("세션 생성 시 예외가 발생한다")
void 세션_생성시_예외가_발생한다() { }
```

## 3. 픽스처 사용 규칙

**`TestFixtures`를 먼저 확인한다. 반드시 사용한다.**

```java
// Good
User host = TestFixtures.user(HOST_ID);
Session session = TestFixtures.session(SESSION_ID, host);
Team team = TestFixtures.team(session);

// Bad - TestFixtures에 있는데 로컬 픽스처 정의
private User userFixture() {
    return User.builder().nickname("host").email("host@test.com").build();
}
```

**로컬 픽스처는 테스트 클래스에 특화된 데이터가 필요할 때만 허용한다.**

```java
// Good - TestFixtures에 없는 특화 데이터
private MatchConfirmedEvent matchConfirmedEventFixture(Long matchId, Long sessionId) { ... }

// Bad - TestFixtures와 중복
private Session sessionFixture(User host) {
    return Session.builder().name("테스트 세션").host(host).build();
}
```

**`TestFixtures`에 없는 공통 픽스처가 필요하면 `TestFixtures`에 추가한다.**

## 4. 상수 사용 규칙

```java
// Good - 클래스 상단에 상수 정의 후 일관 사용
private static final Long HOST_ID = 1L;
private static final Long SESSION_ID = 10L;

given(userRepository.findById(HOST_ID)).willReturn(...);

// Bad - 하드코딩 혼용
given(userRepository.findById(1L)).willReturn(...);  // HOST_ID가 있는데 1L 사용
```

## 5. 중복 테스트 금지

같은 동작을 두 개의 테스트로 검증하지 않는다.

```java
// Bad - 동일한 시나리오를 두 테스트가 중복 검증
@Test
void 존재하지_않는_유저가_세션_생성시_예외가_발생한다() { ... } // HOST_ID 사용

@Test
void 존재하지않는_사용자로_세션_생성시_예외를_던진다() { ... } // 99L 하드코딩, 같은 케이스
```

한 동작(성공/실패)당 테스트 하나. 단, **검증 대상이 다르면** 분리한다.

```java
// Good - 같은 성공 케이스지만 검증 대상이 다름
@Test
void 세션_생성_성공시_응답을_반환한다() {
    // response 값 검증
}

@Test
void 세션_생성시_rules가_있으면_Rule이_저장된다() {
    // repository 호출 검증 (then().should())
}
```

## 6. 테스트 클래스 구조

```java
@ExtendWith(MockitoExtension.class)          // 단위 테스트
@DataJpaTest @Import(JpaConfig.class)        // 슬라이스 테스트
@DisplayName("대상 클래스 + 테스트 주제")
class 대상클래스Test {

    // 1. Mock 선언
    @Mock private SomeRepository someRepository;
    @InjectMocks private SomeService someService;

    // 2. 공유 상수
    private static final Long USER_ID = 1L;

    // 3. 공유 픽스처 (@BeforeEach) - 모든 테스트에서 쓰이는 것만
    @BeforeEach
    void setUp() { ... }

    // 4. 테스트 메서드 - 성공 케이스 → 실패 케이스 순서
    @Test
    void 성공_케이스() { ... }

    @Test
    void 실패_케이스_예외가_발생한다() { ... }

    // 5. 로컬 픽스처 (특화 데이터만)
    private SomeEvent someEventFixture() { ... }
}
```

## 7. Mockito 스텁 규칙

```java
// Bad - Mockito 기본값(false, null, 0)을 불필요하게 명시
given(sessionRepository.existsByRoomUrl(any())).willReturn(false);

// Good - 기본값은 스텁 생략
// (존재하지 않는 URL → false 반환은 Mockito 기본 동작)

// Bad - UnnecessaryStubbing 유발 (해당 테스트에서 호출되지 않는 stub)
given(ruleRepository.findBySessionId(SESSION_ID)).willReturn(List.of()); // 이 테스트에서 안 쓰임
```

## 8. import 규칙

```java
// Bad - 중복 import
import com.killnagi.domain.session.dto.request.RuleRequest;
import com.killnagi.domain.session.dto.request.RuleRequest;  // 중복

// Bad - nested enum을 outer class 경로로 import 안 함
import com.killnagi.domain.rule.entity.RuleType;  // RuleType은 Rule의 nested enum

// Good - nested enum은 명시적으로 import
import com.killnagi.domain.rule.entity.Rule.RuleType;
import com.killnagi.domain.rule.entity.Rule.Operator;
```

---

## 체크리스트

테스트 작성 후 아래를 확인한다.

- [ ] 메서드명이 한국어 `[상황]_[기대결과]` 형식인가?
- [ ] 메서드 레벨 `@DisplayName`이 없는가?
- [ ] `TestFixtures`에 있는 픽스처를 로컬에 재정의하지 않았는가?
- [ ] 상수를 일관되게 사용했는가? (하드코딩 혼용 없음)
- [ ] 동일한 동작을 두 테스트가 중복 검증하지 않는가?
- [ ] 불필요한 스텁이 없는가? (UnnecessaryStubbing 경고 없음)
- [ ] import가 중복되거나 잘못된 경로를 사용하지 않는가?