# product/features — 허브 FRD 스텁

기능정의(FRD)의 **원문은 [mechuri-docs](https://github.com/everyware-ie/mechuri-docs)의 `products/kill-betting/specs/frd/`에만** 있다.
이 폴더는 기능별 **스텁 1개씩**: 허브 approved FRD 링크 + 참조 시점 + 구현 노트만 담는다. 규칙 원문을 복사하지 않는다 (이중 관리 → 어긋남의 근원).

## 스텁 템플릿

```markdown
# <기능 이름>

- FRD: https://github.com/everyware-ie/mechuri-docs/blob/main/products/kill-betting/specs/frd/<파일>.md
- 참조 시점: <YYYY-MM-DD> / 허브 커밋 <sha 앞 7자리> / status: approved
- 구현 상태: 진행 중 | 완료 (<PR 링크>)

## 구현 노트
<코드 구조, 기술적 선택, FRD와의 매핑 등 — 구현자가 자유롭게>

## 어긋남 기록
<허브 FRD와 불일치 발견 시: 날짜, 내용, 이슈 링크>
```

## 규칙

1. **허브가 상류**: 스텁과 허브 FRD가 어긋나면 허브가 우선. 발견 즉시 이슈 생성.
2. **approved만 구현**: 허브 FRD의 status가 `approved`가 아니면 착수하지 않는다.
3. 허브 FRD가 개정되면(revised) 스텁의 "참조 시점"을 갱신하고 구현 영향을 확인한다 — 허브 AI의 Sync Check가 개정 시 이슈 생성을 제안한다.
