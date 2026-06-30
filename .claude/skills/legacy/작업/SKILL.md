---
name: 작업
description: >
사용자가 "작업"이라고 하면 실행되는 스킬.
git origin/main 기준 신규 워크트리 생성 → 브랜치 컨벤션에 맞는 브랜치 생성 →
개발(기존 스킬 or 직접 코딩) → 커밋 컨벤션에 맞는 커밋 → gh로 PR 생성 →
리뷰어가 알아야 할 사항 콘솔 출력까지 자동화.
"작업 시작해줘", "이거 작업해줘", "작업 진행해" 등의 표현이 오면 반드시 이 스킬 사용.
---

# Git Worktree PR 자동화 스킬

사용자가 **"작업"** 이라고 하면 실행되는 전체 개발 플로우 자동화 스킬.

---

## 사전 조건

- `git`, `gh` CLI 설치 및 인증 완료 가정
- `gh auth status` 로 인증 상태 확인 후 미인증이면 중단하고 사용자에게 안내

---

## Step 0: 컨벤션 파일 확인

### `./conventions/git.md` 존재 여부 확인

```bash
cat ./conventions/git.md 2>/dev/null
```

**파일 있음** → 해당 파일에서 아래 항목 파싱하여 사용:
- 브랜치 네이밍 규칙
- 커밋 메시지 형식
- PR 제목/본문 형식 (있는 경우)

**파일 없음** → 사용자에게 아래 항목 질문:

| 항목 | 예시 |
|------|------|
| 브랜치 네이밍 규칙 | `feat/이슈번호-작업명`, `feature/작업명` 등 |
| 커밋 메시지 형식 | `feat: 내용`, `[FEAT] 내용`, `feat(scope): 내용` 등 |
| PR 제목 형식 | 커밋과 동일 여부 등 |

수집 후 `./conventions/git.md` 파일 생성:

```markdown
# Git Convention

## Branch Naming
{사용자 답변 그대로}

## Commit Message
{사용자 답변 그대로}

## PR Title
{사용자 답변 그대로}
```

> 🟡 나중 범위: git.md 포맷 표준화는 지금 하지 않음. 사용자 답변 그대로 저장.

---

## Step 1: origin/main 최신화 및 워크트리 생성

```bash
# 1. origin/main fetch
git fetch origin main

# 2. 작업 디렉토리명 = 브랜치명 기반 (슬래시 → 하이픈 치환)
# 예: feat/123-login → ../worktrees/feat-123-login
BRANCH_NAME="{컨벤션에 맞게 생성한 브랜치명}"
WORKTREE_DIR="../worktrees/$(echo $BRANCH_NAME | tr '/' '-')"

# 3. 워크트리 생성 (origin/main 기준 신규 브랜치)
git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" origin/main

# 4. 워크트리로 이동
cd "$WORKTREE_DIR"
```

브랜치명 생성 규칙: Step 0에서 파싱한 컨벤션 + 사용자가 요청한 작업 내용 조합.
사용자에게 생성된 브랜치명 확인받고 진행.

---

## Step 2: 개발 스킬 확인 및 개발 진행

### 개발 스킬 존재 여부 확인

`./conventions/dev-skill.md` 또는 프로젝트 루트의 `CLAUDE.md` 에서 개발 관련 스킬 정의 확인.

**스킬 있음** → 해당 스킬의 지시에 따라 개발 진행

**스킬 없음** → Claude Code가 직접 아래 순서로 진행:
1. 작업 범위 파악 (사용자 요청 재확인)
2. 영향 범위 파악 (기존 코드 탐색)
3. 구현
4. 기본 검증 (빌드 가능 여부 확인)

> ⚠️ 개발 중 범위 이탈 감지 시 즉시 멈추고 사용자에게 알릴 것.
> "이건 지금 범위 밖입니다 — 나중에 처리할까요?" 로 물을 것.

---

## Step 3: 커밋

Step 0에서 파싱한 커밋 컨벤션 적용.

```bash
git add -A
git status  # 커밋 대상 파일 목록 출력 후 사용자 확인
git commit -m "{컨벤션에 맞는 커밋 메시지}"
```

커밋 메시지 생성 규칙:
- 작업 내용을 한 줄로 요약
- Step 0 컨벤션 형식 적용
- 사용자에게 최종 메시지 보여주고 확인 후 커밋

---

## Step 4: PR 생성

```bash
git push origin "$BRANCH_NAME"

gh pr create \
  --title "{PR 제목 — 컨벤션 적용}" \
  --body "{PR 본문}" \
  --base main
```

### PR 본문 자동 생성 항목

```markdown
## 작업 내용
{무엇을 했는지 1~3줄}

## 변경 파일
{git diff --name-only 결과}

## 테스트
- [ ] 빌드 확인
- [ ] (해당 시) 단위 테스트 통과
```

---

## Step 5: 리뷰어를 위한 정리 — 콘솔 출력

PR 생성 완료 후 아래 내용을 콘솔에 출력:

```
============================
📋 리뷰 가이드
============================

🔗 PR URL: {gh pr view --json url 결과}

📁 변경 파일 목록:
{git diff origin/main --name-only}

🎯 핵심 변경 포인트:
{Claude가 작업 내용 기반으로 자동 생성 — 리뷰어가 집중해야 할 파일/함수/로직}

⚠️ 리뷰 시 주의사항:
{사이드 이펙트 가능성, 의도적 trade-off, 리뷰어가 배경을 알아야 하는 결정}

🧪 검증 방법:
{로컬 실행 방법 또는 테스트 명령어}

============================
```

> 핵심 변경 포인트 / 주의사항은 Claude가 작업 내용 기반으로 자동 판단하여 채움.
> 없으면 해당 항목 생략.

---

## 에러 대응

| 상황 | 처리 |
|------|------|
| `gh auth` 미인증 | 중단 + `gh auth login` 안내 |
| 워크트리 경로 충돌 | 기존 워크트리 목록 출력 후 사용자 판단 |
| 빌드 실패 | 에러 출력 후 개발 단계로 복귀 |
| PR 생성 실패 | gh 에러 메시지 그대로 출력 + 수동 명령어 안내 |

---

## 전체 플로우 요약

```
Step 0: ./conventions/git.md 확인 (없으면 생성)
   ↓
Step 1: git fetch origin/main → worktree 생성 → 브랜치 생성
   ↓
Step 2: 개발 스킬 확인 → 개발 진행
   ↓
Step 3: 커밋 컨벤션 적용 → 커밋
   ↓
Step 4: push → gh pr create
   ↓
Step 5: 리뷰 가이드 콘솔 출력
```
