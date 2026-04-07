# Git 컨벤션

## 브랜치 전략

```
main        ← 배포 브랜치 (직접 push 금지)
develop     ← 통합 브랜치
feature/*   ← 기능 개발
fix/*       ← 버그 수정
chore/*     ← 설정, 의존성 등 비기능 변경
```

### 브랜치 네이밍
형식: `<작업자>/<작업 유형>/<기능>`

```
jminkkk/feature/score-calculation
jminkkk/feature/match-image-upload
jminkkk/fix/kill-count-parsing-error
jminkkk/chore/add-eslint-config
```

---

## 커밋 메시지

형식: `<type>(scope): <description>`

| type | 사용 상황 |
|------|-----------|
| feat | 새 기능 추가 |
| fix | 버그 수정 |
| refactor | 기능 변경 없는 코드 개선 |
| test | 테스트 추가/수정 |
| docs | 문서 변경 |
| chore | 빌드, 설정 변경 |

### 예시
```
feat(match): 매치 결과 이미지 업로드 API 추가
fix(match): 킬 수 파싱 시 닉네임 특수문자 처리 오류 수정
refactor(session): SessionScoreCalculator 서비스 분리
test(match): MatchResultParser 단위 테스트 추가
```

---

## PR 규칙

- PR 제목은 커밋 메시지 형식과 동일
- `feature/*` → `develop` 머지는 PR 필수
- `develop` → `main` 머지는 PR 필수 + approval 후 머지
- PR 본문에 **변경 이유**와 **테스트 방법** 포함
