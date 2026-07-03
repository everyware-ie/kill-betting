---
name: setup-matt-pocock-skills
description: 엔지니어링 스킬을 위해 레포를 설정한다 — 이슈 트래커, 트리아지 레이블 어휘, 도메인 문서 구조를 구성한다. 다른 엔지니어링 스킬을 처음 사용하기 전 한 번 실행한다.
disable-model-invocation: true
---

# 엔지니어링 스킬 초기 설정

엔지니어링 스킬이 필요로 하는 레포별 설정을 구성한다:

- **이슈 트래커** — 이슈가 어디에 있는지 (기본값: GitHub; 로컬 마크다운도 지원)
- **트리아지 레이블** — 다섯 가지 표준 트리아지 역할에 사용하는 문자열
- **도메인 문서** — `CONTEXT.md`와 ADR의 위치, 그리고 읽는 규칙

이 스킬은 결정론적 스크립트가 아닌 프롬프트 기반 스킬이다. 탐색 → 발견 내용 제시 → 사용자 확인 → 파일 작성 순서로 진행한다.

## 진행 순서

### 1. 탐색

현재 레포의 상태를 파악한다. 가정하지 말고 존재하는 것을 읽는다:

- `git remote -v` 및 `.git/config` — GitHub 레포인가? 어느 레포인가?
- 레포 루트의 `AGENTS.md`와 `CLAUDE.md` — 존재하는가? `## Agent skills` 섹션이 이미 있는가?
- 레포 루트의 `CONTEXT.md`와 `CONTEXT-MAP.md`
- `docs/adr/` 및 `src/*/docs/adr/` 디렉토리
- `docs/agents/` — 이 스킬의 이전 출력이 이미 존재하는가?
- `.scratch/` — 로컬 마크다운 이슈 트래커 컨벤션이 이미 사용 중인 신호

### 2. 발견 내용 제시 및 질문

현재 있는 것과 없는 것을 요약한다. 그 다음 세 가지 결정을 **한 번에 하나씩** 안내한다 — 섹션을 제시하고, 사용자의 답변을 받고, 다음으로 넘어간다. 세 가지를 한꺼번에 던지지 않는다.

사용자가 이 용어들을 모른다고 가정한다. 각 섹션은 짧은 설명(무엇인지, 스킬이 왜 필요한지, 다르게 선택하면 무엇이 달라지는지)으로 시작한다. 그 다음 선택지와 기본값을 보여준다.

**섹션 A — 이슈 트래커**

> 설명: "이슈 트래커"는 이 레포의 이슈가 어디에 있는지를 말한다. `to-issues`, `triage`, `to-prd`, `qa` 같은 스킬이 읽고 쓰는 곳이다 — `gh issue create`를 호출할지, `.scratch/` 아래에 마크다운 파일을 쓸지, 또는 다른 워크플로우를 따를지 알아야 한다. 이 레포에서 실제로 작업을 추적하는 곳을 선택한다.

기본 방향: 이 스킬들은 GitHub용으로 설계됐다. `git remote`가 GitHub을 가리키면 GitHub을 제안한다. GitLab(`gitlab.com` 또는 자체 호스팅)을 가리키면 GitLab을 제안한다. 그 외의 경우(또는 사용자가 원하는 경우) 다음 선택지를 제시한다:

- **GitHub** — 이슈가 레포의 GitHub Issues에 있음 (`gh` CLI 사용)
- **GitLab** — 이슈가 레포의 GitLab Issues에 있음 ([`glab`](https://gitlab.com/gitlab-org/cli) CLI 사용)
- **로컬 마크다운** — 이슈가 이 레포의 `.scratch/<feature>/` 아래 파일로 있음 (원격 없는 솔로 프로젝트에 적합)
- **기타** (Jira, Linear 등) — 사용자에게 워크플로우를 한 단락으로 설명하도록 요청하고, 자유 형식 텍스트로 기록

**GitHub** 또는 **GitLab**을 선택한 경우에만 추가 질문:

> 설명: 오픈소스 레포는 이슈뿐만 아니라 PR로도 기능 요청을 받는다 — PR은 코드가 첨부된 이슈다. 이를 활성화하면 `/triage`가 외부 PR을 이슈와 동일한 큐에 넣고 동일한 레이블·상태를 적용한다(협업자의 진행 중인 PR은 그대로 둔다). PR이 요청 창구가 아니라면 비활성화한다.

- **PR을 요청 대상으로 처리** — yes / no (기본값: no). `docs/agents/issue-tracker.md`에 기록. 로컬 마크다운과 기타 트래커는 PR이 없으므로 이 질문 생략.

**섹션 B — 트리아지 레이블 어휘**

> 설명: `triage` 스킬이 이슈를 처리할 때 상태 머신을 통해 이동시킨다 — 평가 필요, 리포터 대기, AFK 에이전트 준비, 사람 준비, 처리 안 함. 이를 위해 실제로 설정된 문자열과 일치하는 레이블을 적용해야 한다. 레포에서 이미 다른 레이블 이름을 사용한다면 (예: `needs-triage` 대신 `bug:triage`) 여기에 매핑해서 스킬이 중복 생성하는 대신 올바른 것을 적용하도록 한다.

다섯 가지 표준 역할:

- `needs-triage` — 메인테이너가 평가해야 함
- `needs-info` — 리포터 추가 정보 대기
- `ready-for-agent` — 완전히 명세됨, AFK 준비 (사람 컨텍스트 없이 에이전트가 처리 가능)
- `ready-for-human` — 사람이 구현해야 함
- `wontfix` — 처리하지 않을 것

기본값: 각 역할의 문자열은 역할 이름과 동일하다. 사용자에게 재정의할 것이 있는지 확인한다. 이슈 트래커에 기존 레이블이 없다면 기본값을 사용하면 된다.

**섹션 C — 도메인 문서**

> 설명: 일부 스킬(`improve-codebase-architecture`, `diagnosing-bugs`, `tdd`)은 `CONTEXT.md` 파일로 프로젝트의 도메인 언어를 파악하고, `docs/adr/`로 과거 아키텍처 결정을 확인한다. 레포에 전역 컨텍스트가 하나인지, 여러 개인지(예: 프론트엔드/백엔드가 별도인 모노레포)를 알아야 올바른 곳을 참조할 수 있다.

구조 확인:

- **단일 컨텍스트** — 레포 루트에 하나의 `CONTEXT.md` + `docs/adr/`. 대부분의 레포가 이에 해당.
- **멀티 컨텍스트** — 루트의 `CONTEXT-MAP.md`가 컨텍스트별 `CONTEXT.md` 파일을 가리킴 (모노레포에 일반적).

### 3. 확인 및 편집

사용자에게 초안을 보여준다:

- `CLAUDE.md` / `AGENTS.md`에 추가할 `## Agent skills` 블록
- `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md` 내용

작성 전에 수정할 기회를 준다.

### 4. 작성

**편집할 파일 선택:**

- `CLAUDE.md`가 있으면 편집한다.
- 없고 `AGENTS.md`가 있으면 편집한다.
- 둘 다 없으면 사용자에게 어느 것을 생성할지 묻는다 — 스스로 선택하지 않는다.

`CLAUDE.md`가 있는데 `AGENTS.md`를 새로 만들거나, 그 반대를 하지 않는다 — 항상 이미 있는 것을 편집한다.

선택한 파일에 `## Agent skills` 블록이 이미 있으면 내용을 제자리에서 업데이트한다. 중복으로 추가하지 않는다.

블록 형식:

```markdown
## Agent skills

### 이슈 트래커

[이슈 추적 위치 한 줄 요약, 외부 PR이 트리아지 대상인지 포함]. `docs/agents/issue-tracker.md` 참조.

### 트리아지 레이블

[레이블 어휘 한 줄 요약]. `docs/agents/triage-labels.md` 참조.

### 도메인 문서

[구조 한 줄 요약 — "단일 컨텍스트" 또는 "멀티 컨텍스트"]. `docs/agents/domain.md` 참조.
```

그 다음 이 스킬 폴더의 시드 템플릿을 시작점으로 세 개의 docs 파일을 작성한다:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub 이슈 트래커
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab 이슈 트래커
- [issue-tracker-local.md](./issue-tracker-local.md) — 로컬 마크다운 이슈 트래커
- [triage-labels.md](./triage-labels.md) — 레이블 매핑
- [domain.md](./domain.md) — 도메인 문서 소비 규칙 및 구조

"기타" 이슈 트래커의 경우 사용자의 설명을 바탕으로 `docs/agents/issue-tracker.md`를 처음부터 작성한다.

### 5. 완료

설정이 완료됐음을 알리고 어떤 엔지니어링 스킬이 이 파일들을 참조할지 안내한다. `docs/agents/*.md`는 나중에 직접 편집할 수 있다 — 이슈 트래커를 변경하거나 처음부터 다시 시작하려는 경우에만 이 스킬을 재실행하면 된다.
