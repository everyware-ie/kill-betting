#!/bin/bash
# PreToolUse 훅 — 구현 착수 시점 게이트
#
# 구현 메인 소스(backend/src/main, frontend/app·components·features·lib)를
# 편집하려 할 때, 이 브랜치에 착수 확인 스텁(docs/product/features/<기능>.md)이
# 파이프라인 필수 필드를 모두 갖춰 존재하지 않으면 편집을 차단한다(exit 2).
#
# 파이프라인 필수 필드(REQUIRED_FIELDS)로 강제 단계를 표현한다:
#   FRD  — 허브 approved FRD 링크 (2단계)
#   이슈 — 이 기능을 분해한 GitHub 이슈 번호(#N) 또는 '없음(소규모)' (3단계)
# 강제 단계를 늘리려면(예: 1단계 요구사항) REQUIRED_FIELDS에 필드명을 추가하고
# stub_field_ok()에 그 필드의 검사식을 더하면 된다. 스텁은 파이프라인 전 단계의
# 단일 증거이므로, 새 아티팩트 없이 필드 하나로 확장된다.
#
# 게이트 대상 판정은 "무엇을 편집하는가"(메인 구현 소스)를 우선한다:
# - 테스트 파일(backend/src/test, *.test.js, *.spec.js)은 대상 아님 —
#   TDD test-first를 브랜치와 무관하게 허용한다.
# - 브랜치 타입 chore/docs는 면제 — FRD 없이 소스를 정당하게 건드리는 작업.
#   (test는 위 경로 제외로 처리하므로 타입 면제에서 뺐다)
#
# 강제 수준(정직한 한계):
# - 강제하는 것: "이 브랜치에서 확인 체크포인트(스텁)가 필수 필드를 갖춰 실행됐다"
# - 강제하지 못하는 것:
#     · 편집 중인 소스 파일이 정확히 그 스텁의 기능인지 (파일→기능 매핑은 shell 범위 밖)
#     · 사람이 실제로 FRD를 정독하고 이슈를 제대로 분해했는지
#   → 즉 파일 단위가 아니라 "브랜치 단위" 체크포인트다.
#
# 비용: 네트워크 호출 없음(로컬 git·파일 검사만). 스텁이 갖춰진 뒤의 편집은
# 즉시 통과하므로 편집마다 부담을 주지 않는다.

# ── 강제할 파이프라인 필드 (여기에 추가하면 강제 단계가 늘어난다) ──
REQUIRED_FIELDS="FRD 이슈"

# 스텁이 특정 필드를 갖췄는지 검사
stub_field_ok() {
    local stub="$1" field="$2"
    case "$field" in
        FRD)      grep -q "mechuri-docs.*specs/frd" "$stub" ;;
        이슈)     grep -qE '^[-*]?[[:space:]]*이슈:[[:space:]]*(#[0-9]+|없음)' "$stub" ;;
        요구사항) grep -qE '^[-*]?[[:space:]]*요구사항:[[:space:]]*\S' "$stub" ;;
        *)        return 1 ;;
    esac
}

# 필드명 → 안내 문구
field_hint() {
    case "$1" in
        FRD)      echo "허브 approved FRD 링크 (mechuri-docs .../specs/frd/<파일>.md)" ;;
        이슈)     echo "이 기능을 분해한 GitHub 이슈 번호 '이슈: #N' (소규모면 '이슈: 없음(소규모)')" ;;
        요구사항) echo "요구사항/PRD 문서 링크 '요구사항: <링크>'" ;;
        *)        echo "$1" ;;
    esac
}

block() {
    local branch="$1" rel="$2" missing="$3"
    {
        echo "[pre-implementation] 구현 착수 전 확인 단계가 필요합니다."
        echo ""
        echo "편집 대상: $rel"
        echo "현재 브랜치: $branch"
        echo ""
        if [ -n "$missing" ]; then
            echo "이 브랜치의 확인 스텁에 다음 필수 항목이 없습니다:"
            for f in $missing; do
                echo "  - $f: $(field_hint "$f")"
            done
        else
            echo "이 브랜치에 확인 스텁이 docs/product/features/ 에 없습니다."
        fi
        echo ""
        echo "착수 전 반드시 (스텁 = 파이프라인 단일 확인 지점):"
        echo "  1. mechuri-docs에서 이 기능의 FRD(status: approved)를 가져와 사용자에게 보여준다"
        echo "  2. 사용자 최종 확인을 받는다"
        echo "  3. 이 기능을 GitHub 이슈로 분해한다 (소규모면 분해 생략을 명시)"
        echo "  4. docs/product/features/<기능>.md 스텁에 FRD 링크 + 이슈 번호를 적는다"
        echo "     (템플릿: docs/product/features/README.md)"
        echo ""
        echo "스텁을 갖춘 뒤 다시 구현을 진행하세요. 'approved FRD'라도 건너뛸 수 없습니다."
    } >&2
    exit 2
}

block_no_base() {
    cat >&2 <<MSG
[pre-implementation] 기준 ref(origin/main)를 확인할 수 없어 안전하게 차단합니다.

새 스텁과 기존 스텁을 구분할 기준 브랜치가 없어(얕은 클론 등),
확인 단계 수행 여부를 신뢰할 수 없습니다.

  git fetch origin

를 실행해 origin/main을 확보한 뒤 다시 진행하세요.
MSG
    exit 2
}

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
REL="${FILE_PATH#$ROOT/}"

# 테스트 파일은 게이트 대상 아님 — TDD test-first를 브랜치 무관하게 허용
case "$REL" in
    backend/src/test/*|*.test.js|*.spec.js)
        exit 0
        ;;
esac

# 구현 메인 소스만 대상 — 그 외(docs, 설정, 스크립트, 빌드 등)는 통과
case "$REL" in
    backend/src/main/*|frontend/app/*|frontend/components/*|frontend/features/*|frontend/lib/*)
        ;;
    *)
        exit 0
        ;;
esac

BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)

# 보호 브랜치는 PR로만 변경되므로 게이트 대상 아님
case "$BRANCH" in
    main|develop) exit 0 ;;
esac

# 차단 제외 목록 — FRD와 무관한 작업 유형은 면제.
# chore/docs만 면제(FRD 없이 메인 소스를 정당하게 건드리는 작업).
# test는 위에서 경로로 제외했으므로 타입 면제 불필요.
# 나머지(feature/fix/hotfix/refactor 등)는 모두 게이트 적용.
TYPE=$(echo "$BRANCH" | cut -d'/' -f2)
case "$TYPE" in
    chore|docs) exit 0 ;;
esac

FEATURES_DIR="$ROOT/docs/product/features"
[ -d "$FEATURES_DIR" ] || block "$BRANCH" "$REL"

# 기준 ref 결정: origin/main 우선(로컬 main의 stale 문제 회피), 없으면 main.
# 둘 다 없으면(얕은 클론 등) fail-closed로 차단한다.
BASE_REF=""
for ref in origin/main main; do
    if git -C "$ROOT" rev-parse --verify "$ref" >/dev/null 2>&1; then
        BASE_REF="$ref"
        break
    fi
done
[ -z "$BASE_REF" ] && block_no_base

# 기준 ref에 이미 있는 스텁 목록 (이 브랜치가 "새로" 만든 확인을 가려내기 위함)
BASE_STUBS=$(git -C "$ROOT" ls-tree -r --name-only "$BASE_REF" -- docs/product/features/ 2>/dev/null \
    | grep -E '\.md$' | grep -v 'README.md')

# 워킹트리의 스텁 중 기준 ref에 없는 것 하나가 REQUIRED_FIELDS를 모두 갖추면 통과.
# 어느 것도 완전하지 않으면, "가장 근접한(FRD는 있으나 이슈만 빠진)" 스텁의
# 누락 필드를 안내한다. FRD도 없으면 "스텁 없음"으로 안내.
CONFIRMED=0
PARTIAL_MISSING=""   # 가장 근접한 스텁에서 빠진 필드
while IFS= read -r stub; do
    [ -z "$stub" ] && continue
    base=$(basename "$stub")
    [ "$base" = "README.md" ] && continue
    relstub="docs/product/features/$base"
    echo "$BASE_STUBS" | grep -qx "$relstub" && continue

    # FRD가 없는 스텁은 "이 기능의 확인 스텁"으로 보지 않음(다른 용도일 수 있음)
    stub_field_ok "$stub" "FRD" || continue

    missing=""
    for field in $REQUIRED_FIELDS; do
        stub_field_ok "$stub" "$field" || missing="$missing $field"
    done
    if [ -z "$missing" ]; then
        CONFIRMED=1
        break
    fi
    # FRD는 있으나 일부 필드 누락 — 안내 후보로 보관
    PARTIAL_MISSING="$missing"
done <<EOF
$(find "$FEATURES_DIR" -maxdepth 1 -name '*.md' 2>/dev/null)
EOF

[ "$CONFIRMED" -eq 1 ] && exit 0

# PARTIAL_MISSING이 있으면 그 누락 필드를, 없으면(FRD 스텁 자체가 없음) 빈값으로 안내
block "$BRANCH" "$REL" "$PARTIAL_MISSING"
