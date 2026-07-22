#!/bin/bash
# PreToolUse 훅 — 구현 착수 시점 게이트
#
# feature/* 브랜치에서 구현 소스(backend/src, frontend/app·components·features·lib)를
# 처음 편집하려 할 때, 해당 기능의 FRD 확인 스텁(docs/product/features/<기능>.md)이
# 없으면 편집을 차단한다(exit 2).
#
# 목적: mechuri-docs의 FRD가 approved라 하더라도, "바로 진행"으로 확인 단계를
# 건너뛰지 못하게 한다. 스텁을 만들려면 허브 FRD 링크를 스텁에 적어야 하므로,
# 착수 직전 AI가 FRD를 가져와 사용자에게 보여주는 확인 단계가 강제된다.
#
# 강제하는 것: "확인 체크포인트(스텁)가 존재한다"
# 강제 못 하는 것: "사람이 실제로 다 읽었다" — 이건 원천적으로 훅의 범위 밖.
#
# 비용: 네트워크 호출 없음(로컬 git·파일 검사만). 스텁이 생긴 뒤의 편집은
# 즉시 통과하므로 편집마다 부담을 주지 않는다.

block() {
    local branch="$1" rel="$2"
    cat >&2 <<MSG
[pre-implementation] 구현 착수 전 FRD 확인 단계가 필요합니다.

편집 대상: $rel
현재 브랜치: $branch (feature 타입)

이 기능의 FRD 확인 스텁이 docs/product/features/ 에 없습니다.
아직 mechuri-docs의 approved FRD를 가져와 확인하는 단계를 거치지 않았습니다.

착수 전 반드시:
  1. mechuri-docs에서 이 기능의 FRD(status: approved)를 가져와 사용자에게 보여준다
  2. 사용자 최종 확인을 받는다
  3. docs/product/features/<기능>.md 스텁을 만든다
     (허브 FRD 링크 + 참조 시점/SHA + 구현 노트 — 템플릿: docs/product/features/README.md)

스텁을 만든 뒤 다시 구현을 진행하세요.
approved FRD라도 이 확인 단계는 건너뛸 수 없습니다.
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

# 구현 소스만 대상 — 그 외(docs, 설정, 스크립트 등)는 통과
case "$REL" in
    backend/src/*|frontend/app/*|frontend/components/*|frontend/features/*|frontend/lib/*)
        ;;
    *)
        exit 0
        ;;
esac

BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)
TYPE=$(echo "$BRANCH" | cut -d'/' -f2)

# feature 브랜치에서만 게이트 적용 (chore/fix/refactor/docs/test는 FRD 무관)
[ "$TYPE" != "feature" ] && exit 0

FEATURES_DIR="$ROOT/docs/product/features"
[ -d "$FEATURES_DIR" ] || block "$BRANCH" "$REL"

# main에 이미 있는 스텁 목록 (이 브랜치가 "새로" 만든 확인을 가려내기 위함)
MAIN_STUBS=$(git -C "$ROOT" ls-tree -r --name-only main -- docs/product/features/ 2>/dev/null \
    | grep -E '\.md$' | grep -v 'README.md')

# 워킹트리의 스텁 중 main에 없고 허브 FRD 링크를 담은 것이 하나라도 있으면 통과
CONFIRMED=0
while IFS= read -r stub; do
    [ -z "$stub" ] && continue
    base=$(basename "$stub")
    [ "$base" = "README.md" ] && continue
    relstub="docs/product/features/$base"
    echo "$MAIN_STUBS" | grep -qx "$relstub" && continue
    if grep -q "mechuri-docs.*specs/frd" "$stub" 2>/dev/null; then
        CONFIRMED=1
        break
    fi
done <<EOF
$(find "$FEATURES_DIR" -maxdepth 1 -name '*.md' 2>/dev/null)
EOF

[ "$CONFIRMED" -eq 1 ] && exit 0

block "$BRANCH" "$REL"
