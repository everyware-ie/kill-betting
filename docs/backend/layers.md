# 레이어 지침

---

## Controller

**역할**: HTTP 요청 수신 + 응답 반환만. 비즈니스 로직 포함 금지.

### 설정 규칙
- `@RestController` 사용 (`@Controller` + `@ResponseBody` 조합 금지)
- 클래스 레벨 `@RequestMapping`에 API 버전 포함: `/api/v1/...`
- `@RequestMapping` 단독 사용 금지 — `@GetMapping`, `@PostMapping` 등 메서드별 애너테이션 사용

### 요청 파라미터
- `@RequestBody`에 항상 `@Valid` 함께 사용
- `@RequestParam` 선택적 파라미터 → `required = false` + `defaultValue` 명시
- 목록 조회 → `Pageable` + `@PageableDefault`로 기본값 설정

### 응답

| 상황 | 상태 코드 |
|------|----------|
| 조회 성공 | `200 OK` |
| 생성 성공 | `201 Created` + Location 헤더 |
| 본문 없음 | `204 No Content` |
| 입력 오류 / 리소스 없음 / 서버 오류 | GlobalExceptionHandler 위임 |

201 Created 시 Location 헤더 포함:
```java
URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}").buildAndExpand(response.getId()).toUri();
return ResponseEntity.created(location).body(ApiResponse.success(response));
```

### 검증
- 형식 검증(`null`, 길이 등) → Controller (`@Valid`)
- 비즈니스 규칙 검증 → Service / Domain
- `try-catch` 작성 금지. 검증 실패는 GlobalExceptionHandler 위임.

### DTO
- Entity를 Controller 레이어에 직접 노출 금지
- 불변 DTO는 `record` 사용

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| Controller 클래스 | `{Domain}Controller` | `SessionController` |
| Request DTO | `{UseCase}Request` | `MatchResultUploadRequest` |
| Response DTO | `{UseCase}Response` | `ScoreBoardResponse` |

---

## Domain (Entity)

**역할**: 비즈니스 불변 규칙을 포함하는 핵심 도메인 모델.

### 모델 스타일

**Rich Domain Model** — 비즈니스 규칙은 Service가 아닌 Entity 메서드에 위치한다.

```java
// Bad (Anemic): Service가 모든 규칙을 가짐
if (session.getRemainingSlot() <= 0) throw new BusinessException(...);

// Good (Rich): Entity가 규칙을 보호
session.addTeam(team); // 내부에서 슬롯 확인 + 예외 처리
```

### JPA Entity 규칙

- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 필수
- `@Builder` 또는 정적 팩토리 메서드(`of`, `create`)로만 생성. 생성자 직접 호출 금지.
- `@Builder` + `@NoArgsConstructor` 조합 시 `@AllArgsConstructor` 명시 필요
- `@Setter` 금지 — 상태 변경은 의미 있는 도메인 메서드로만
- `@Data` 금지 — 순환 참조, 프록시 오작동 위험
- `@EqualsAndHashCode` 금지 — Hibernate 프록시 오동작. ID 기반으로 직접 구현.

### 필드 설계

| 항목 | 규칙 |
|------|------|
| `@Column` | `nullable = false` 명시, 문자열은 `length` 지정 |
| Enum | `@Enumerated(EnumType.STRING)` 필수. `ORDINAL` 사용 금지 |
| 날짜/시간 | `LocalDateTime` 사용. `Date`, `Calendar` 금지 |
| 생성/수정 시각 | `@CreatedDate`, `@LastModifiedDate` 사용 |

### 연관관계

- 양방향 연관관계는 꼭 필요한 경우에만. 단방향으로 충분하면 단방향 유지.
- `@ManyToOne`은 반드시 `fetch = FetchType.LAZY` 명시 (기본값 EAGER)
- `@OneToMany`는 `LAZY` 유지 (기본값)
- 연관 컬렉션은 `new ArrayList<>()`로 초기화 (NPE 방지)

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "session_id")
private Session session;
```

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| Entity | 도메인 용어 그대로, 단수형 | `Session`, `MatchResult` |
| 도메인 메서드 | 도메인 용어 기반 동사 | `start()`, `reflect()` |
| 상태 Enum | `{Domain}Status` | `SessionStatus` |

---

## Repository

**역할**: 데이터 접근만. 비즈니스 로직 포함 금지.

### 기본 규칙

- `JpaRepository<Entity, ID>` 상속
- `@Transactional` 선언 금지 — 트랜잭션 경계는 Service 담당
- `findAll()` 단독 호출 금지 — 반드시 조건 또는 페이징 함께 사용

### 쿼리 작성

- 단순 조회 → 메서드 이름 기반 쿼리 (Derived Query)
- 조건 3개 이상 또는 복잡한 조건 → `@Query` (JPQL)
- UPDATE/DELETE → `@Modifying(clearAutomatically = true)` 필수

```java
// clearAutomatically: 1차 캐시와 DB 불일치 방지
@Modifying(clearAutomatically = true)
@Query("UPDATE Session s SET s.status = :status WHERE s.id = :id")
int updateStatus(@Param("id") Long id, @Param("status") SessionStatus status);
```

### N+1 방지

연관 엔티티 함께 조회 시 Fetch Join 또는 `@EntityGraph` 사용:

```java
@Query("SELECT s FROM Session s JOIN FETCH s.teams WHERE s.id = :id")
Optional<Session> findWithTeams(@Param("id") Long id);
```

### 페이징

| 타입 | 특징 | 사용 시점 |
|------|------|----------|
| `Page<T>` | 전체 count 쿼리 추가 | 전체 페이지 수 필요 |
| `Slice<T>` | count 쿼리 없음 | 무한 스크롤 등 |

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| Repository | `{Domain}Repository` | `SessionRepository` |
| 조회 | `find{Target}By{Condition}` | `findBySessionIdAndTeamId` |
| 존재 확인 | `existsBy{Condition}` | `existsBySessionIdAndUserId` |

---

## Service

**역할**: 비즈니스 로직 진입점. 트랜잭션 경계 담당. Domain + Repository 조합.

### 트랜잭션

클래스 레벨 `readOnly = true` 선언 후, 쓰기 메서드에만 `@Transactional` 오버라이드:

```java
@Service
@Transactional(readOnly = true)
public class SessionService {
    public SessionResponse get(Long id) { ... }  // readOnly 상속

    @Transactional  // 쓰기 오버라이드
    public void start(Long id) { ... }
}
```

트랜잭션 주의사항:
- `private` 메서드에 `@Transactional` 선언 금지 (AOP 미적용)
- 같은 클래스 내 Self-Invocation 금지 (프록시를 거치지 않아 트랜잭션 미적용)
- Checked Exception은 기본적으로 롤백 안 됨 → 도메인 예외는 `RuntimeException` 상속

```java
// Bad: self-invocation — innerMethod의 @Transactional 무시됨
public void outer() { this.inner(); }

@Transactional
public void inner() { ... }
```

### 의존성 규칙

- Service → 타 Service 의존 가능
- Service → Entity 직접 반환 금지. Response DTO 또는 값 객체(enum)로 변환 후 반환.
- `@Transactional` 범위 밖에서 연관 엔티티 접근 금지 (LazyInitializationException)

### 예외 처리

- 비즈니스 규칙 위반 → `BusinessException` 던지기
- 예외를 catch 후 재포장 시 원인(cause) 반드시 포함
- 예외를 삼키는(swallow) 코드 금지

### 인터페이스 분리

다중 구현체가 필요한 경우에만 인터페이스 분리. 단일 구현체라면 클래스를 직접 사용.

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| Service 클래스 | `{Domain}Service` | `SessionService` |
| 조회 메서드 | `get{Target}` | `getScoreBoard` |
| 생성/처리 메서드 | 동사 + 명사 | `startSession`, `reflectMatch` |
