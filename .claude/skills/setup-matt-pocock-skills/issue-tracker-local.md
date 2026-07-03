# 이슈 트래커: 로컬 마크다운

이 레포의 이슈와 PRD는 `.scratch/` 아래 마크다운 파일로 관리한다.

## 컨벤션

- 기능별 디렉토리: `.scratch/<feature-slug>/`
- PRD 파일: `.scratch/<feature-slug>/PRD.md`
- 구현 이슈: `.scratch/<feature-slug>/issues/<NN>-<slug>.md` (01부터 번호 부여)
- 트리아지 상태는 각 이슈 파일 상단의 `Status:` 줄에 기록 (역할 문자열은 `triage-labels.md` 참조)
- 댓글과 대화 이력은 파일 하단 `## 댓글` 섹션에 추가

## 스킬에서 "이슈 트래커에 게시"라고 할 때

`.scratch/<feature-slug>/` 아래에 새 파일을 생성한다 (디렉토리가 없으면 함께 생성).

## 스킬에서 "관련 티켓을 가져와"라고 할 때

참조된 경로의 파일을 읽는다. 사용자가 보통 경로나 이슈 번호를 직접 전달한다.
