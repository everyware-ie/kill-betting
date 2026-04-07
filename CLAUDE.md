# CLAUDE.md

## 서비스 개요
배틀그라운드 킬내기 세션 점수 자동 계산 서비스.
팀들이 매치 결과 이미지를 업로드하면 세션 룰에 따라 점수를 자동 집계한다.

## 팀 & 스택
- 백엔드: Java / Spring Boot
- 프론트엔드: React / Next.js
- 레포: 모노레포 (FE + BE 단일 레포)
- 개발 방식: 사이드 프로젝트 / 2주 애자일 스프린트

## 레포 구조
```
/
├── backend/
├── frontend/
├── .claude/
│   ├── conventions/
│   │   ├── backend.md     # Spring Boot 컨벤션
│   │   │   └── docs/              # 백엔드 개발을 위한 기능 명세 (FRD)
│   │   └── frd-match-image-upload.md
│   │   ├── frontend.md    # Next.js 컨벤션
│   │   └── git.md         # Git 브랜치/커밋 규칙
│   ├── domain/
│   │   └── glossary.md    # 도메인 용어 사전
│   └── status.md          # 현재 개발 진행 상태
└── CLAUDE.md
```

---

## 핵심 도메인 용어
> 전체 용어 정의 → @.claude/domain/glossary.md

| 용어 | 한 줄 설명 |
|------|-----------|
| Session | 하나의 킬내기 이벤트 (여러 Match 포함) |
| Match | 배그 한 판 결과 |
| SessionRule | 세션별 점수 계산 룰 정의 |
| MatchResult | 이미지에서 파싱된 한 판 데이터 |
| ScoreBoard | 세션 내 누적 점수 집계 |
| Participant | 세션 참여 유저 또는 팀 |

---

## 작업 유형별 참조 파일

> 작업 시작 전 해당하는 파일을 먼저 읽을 것.

| 작업 상황 | 읽어야 할 파일                                |
|-----------|-----------------------------------------|
| Git 브랜치 생성 / 커밋 / PR | @.claude/conventions/git.md             |
| 백엔드 코드 작성 / 리뷰 | @.claude/conventions/backend.md         |
| 프론트엔드 코드 작성 / 리뷰 | @.claude/conventions/frontend.md        |
| 도메인 용어가 불명확할 때 | @.claude/domain/glossary.md             |
| 현재 개발 상태 파악 | @.claude/status.md                      |
| 매치 이미지 업로드 기능 작업 시 | @.claude/docs/FRD/match-image-upload.md |
