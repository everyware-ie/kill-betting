# 이슈 트래커: GitLab

이 레포의 이슈와 PRD는 GitLab 이슈로 관리한다. 모든 작업에 [`glab`](https://gitlab.com/gitlab-org/cli) CLI를 사용한다.

## 컨벤션

- **이슈 생성**: `glab issue create --title "..." --description "..."`. 여러 줄 설명은 heredoc 사용. `--description -`으로 에디터 열기 가능.
- **이슈 조회**: `glab issue view <number> --comments`. 기계 읽기용 출력은 `-F json` 사용.
- **이슈 목록**: `glab issue list -F json`. `--label` 필터 활용.
- **댓글 작성**: `glab issue note <number> --message "..."`. GitLab에서 댓글은 "노트"라고 부름.
- **레이블 추가/제거**: `glab issue update <number> --label "..."` / `--unlabel "..."`. 여러 레이블은 쉼표로 구분하거나 플래그 반복.
- **이슈 닫기**: `glab issue close <number>`. 닫기 시 댓글을 지원하지 않으므로 먼저 `glab issue note`로 설명을 남긴 후 닫는다.
- **머지 리퀘스트**: GitLab에서 PR은 "머지 리퀘스트"라고 부른다. `glab mr create`, `glab mr view`, `glab mr note` 등 — `gh pr ...`과 동일한 구조에서 `pr` → `mr`, `comment`/`--body` → `note`/`--message`.

레포는 `git remote -v`에서 자동으로 추론된다.

## 머지 리퀘스트의 트리아지 대상 여부

**MR을 요청 대상으로 처리: no.** _(외부 MR을 기능 요청으로 처리할 경우 `yes`로 변경; `/triage` 스킬이 이 값을 읽음.)_

`yes`로 설정된 경우, MR도 이슈와 동일한 레이블·상태를 거치며 `glab mr` 명령어를 사용한다:

- **MR 조회**: `glab mr view <number> --comments` 및 `glab mr diff <number>`.
- **외부 MR 트리아지 목록**: `glab mr list -F json` 후 프로젝트 멤버/오너가 아닌 작성자의 MR만 유지.
- **댓글/레이블/닫기**: `glab mr note`, `glab mr update --label`/`--unlabel`, `glab mr close`.

GitHub과 달리 GitLab은 이슈와 MR 번호가 독립적이므로 `#42`는 맥락에서 명확하다.

## 스킬에서 "이슈 트래커에 게시"라고 할 때

GitLab 이슈를 생성한다.

## 스킬에서 "관련 티켓을 가져와"라고 할 때

`glab issue view <number> --comments`를 실행한다.
