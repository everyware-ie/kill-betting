# product/features — 허브 FRD 스텁

기능정의(FRD)의 **원문은 [mechuri-docs](https://github.com/everyware-ie/mechuri-docs)의 `products/kill-betting/specs/frd/`에만** 있다.
이 폴더는 기능별 **스텁 1개씩**: 허브 approved FRD 링크 + 참조 시점 + 구현 노트만 담는다. 규칙 원문을 복사하지 않는다 (이중 관리 → 어긋남의 근원).

이 스텁은 착수 전 파이프라인(FRD 확인 → 이슈 분해 → 착수)이 실제로 수행됐음을
증명하는 **단일 확인 지점**이다. 착수·PR 게이트(훅)가 아래 필드를 검사한다.

## 스텁 템플릿

```markdown
# <기능 이름>

- FRD: https://github.com/everyware-ie/mechuri-docs/blob/main/products/kill-betting/specs/frd/<파일>.md
- 이슈: #NN, #NN         # 이 기능을 분해한 GitHub 이슈. 단위가 작아 분해가 불필요하면: 없음(소규모)
- 참조 시점: <YYYY-MM-DD> / 허브 커밋 <sha 앞 7자리> / status: approved
- 구현 상태: 진행 중 | 완료 (<PR 링크>)

## 구현 노트
<코드 구조, 기술적 선택, FRD와의 매핑 등 — 구현자가 자유롭게>

## 어긋남 기록
<허브 FRD와 불일치 발견 시: 날짜, 내용, 이슈 링크>
```

> **[미래 확장]** 요구사항 분석(1단계)까지 강제하기로 하면, 위에 한 줄을 더 켠다:
> `- 요구사항: <PRD/요구사항 문서 링크>` — 그리고 착수 게이트의 `REQUIRED_FIELDS`에
> `요구사항`을 추가하면 된다. 스텁 = 파이프라인 전 단계의 단일 증거이므로,
> 강제 단계를 늘려도 새 아티팩트 없이 필드 하나로 확장된다.

## 규칙

1. **허브가 상류**: 스텁과 허브 FRD가 어긋나면 허브가 우선. 발견 즉시 이슈 생성.
2. **approved만 구현**: 허브 FRD의 status가 `approved`가 아니면 착수하지 않는다.
3. **이슈로 분해 후 착수**: 착수 전 이 기능을 GitHub 이슈로 분해해 `이슈:`에 적는다. 단위가 작아 분해가 무의미하면 `없음(소규모)`로 명시(생략 불가 — 판단을 강제하기 위함).
4. 허브 FRD가 개정되면(revised) 스텁의 "참조 시점"을 갱신하고 구현 영향을 확인한다 — 허브 AI의 Sync Check가 개정 시 이슈 생성을 제안한다.
