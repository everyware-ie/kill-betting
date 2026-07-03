# 이슈 트래커: GitHub

이 레포의 이슈와 PRD는 GitHub 이슈로 관리한다. 모든 작업에 `gh` CLI를 사용한다.

## 컨벤션

- **이슈 생성**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc 사용.
- **이슈 조회**: `gh issue view <number> --comments`. 댓글과 레이블을 함께 확인.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`. `--label`, `--state` 필터 활용.
- **댓글 작성**: `gh issue comment <number> --body "..."`
- **레이블 추가/제거**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **이슈 닫기**: `gh issue close <number> --comment "..."`

레포는 `git remote -v`에서 자동으로 추론된다 — 클론 내부에서 `gh` 실행 시 자동 적용.

## PR의 트리아지 대상 여부

**PR을 요청 대상으로 처리: no.** _(외부 PR을 기능 요청으로 처리할 경우 `yes`로 변경; `/triage` 스킬이 이 값을 읽음.)_

`yes`로 설정된 경우, PR도 이슈와 동일한 레이블·상태를 거치며 `gh pr` 명령어를 사용한다:

- **PR 조회**: `gh pr view <number> --comments` 및 `gh pr diff <number>`.
- **외부 PR 트리아지 목록**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` 후 `authorAssociation`이 `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE`인 것만 유지 (`OWNER`/`MEMBER`/`COLLABORATOR` 제외).
- **댓글/레이블/닫기**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub은 이슈와 PR이 번호 공간을 공유하므로 `#42`는 둘 중 하나일 수 있다 — `gh pr view 42`로 확인 후 실패하면 `gh issue view 42`로 대체.

## 스킬에서 "이슈 트래커에 게시"라고 할 때

GitHub 이슈를 생성한다.

## 스킬에서 "관련 티켓을 가져와"라고 할 때

`gh issue view <number> --comments`를 실행한다.
