#!/bin/bash
# PreToolUse 훅 — gh pr create 감지 시 PR 체크리스트 자동 주입 + FRD 승인 상태 게이트
#
# 게이트: 이 PR이 참조하는 mechuri-docs FRD의 status가 approved가 아니면 PR
# 생성을 차단한다(exit 2). FRD 참조는 아래 세 경로에서 모은다:
#   1) gh pr create 커맨드라인의 인라인 본문(--body "..." 등)
#   2) --body-file / -F 로 지정한 파일 내용
#   3) 이 브랜치가 새로 만든 확인 스텁(docs/product/features/*.md)의 FRD 링크
#      → 본문을 어떤 방식으로 넘기든(--fill·에디터·stdin 포함) 스텁 기반으로 검증
# 어떤 경로에서도 FRD 링크가 없으면 검사 대상이 아니다(chore/docs 등).
# 허브 접근 실패(네트워크 등) 시에는 차단하지 않고 경고만 한다.

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

if ! echo "$COMMAND" | grep -q "gh pr create"; then
    exit 0
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

# ── 검사 대상 텍스트(corpus) 수집 ──
CORPUS="$COMMAND"

# --body-file / -F 로 넘긴 파일 내용 포함 ('-'(stdin)는 훅 시점에 읽을 수 없음)
BODY_FILE=$(echo "$COMMAND" | grep -oE '(--body-file|-F)[= ]+[^ ]+' | head -1 | sed -E 's/^(--body-file|-F)[= ]+//')
if [ -n "$BODY_FILE" ] && [ "$BODY_FILE" != "-" ]; then
    [ -f "$BODY_FILE" ] || BODY_FILE="$ROOT/$BODY_FILE"
    if [ -f "$BODY_FILE" ]; then
        CORPUS="$CORPUS
$(cat "$BODY_FILE")"
    fi
fi

# 이 브랜치가 새로 만든 확인 스텁 내용 포함(본문 전달 방식과 무관하게 검증)
# STUB_TEXT는 스텁 내용만 따로 모은다 — 이슈 번호는 커맨드의 무관한 #N을
# 오탐하지 않도록 스텁에서만 추출한다.
STUB_TEXT=""
if [ -n "$ROOT" ] && [ -d "$ROOT/docs/product/features" ]; then
    BASE_REF=""
    for ref in origin/main main; do
        git -C "$ROOT" rev-parse --verify "$ref" >/dev/null 2>&1 && { BASE_REF="$ref"; break; }
    done
    BASE_STUBS=$(git -C "$ROOT" ls-tree -r --name-only "$BASE_REF" -- docs/product/features/ 2>/dev/null \
        | grep -E '\.md$' | grep -v 'README.md')
    while IFS= read -r stub; do
        [ -z "$stub" ] && continue
        base=$(basename "$stub")
        [ "$base" = "README.md" ] && continue
        relstub="docs/product/features/$base"
        echo "$BASE_STUBS" | grep -qx "$relstub" && continue
        CORPUS="$CORPUS
$(cat "$stub")"
        STUB_TEXT="$STUB_TEXT
$(cat "$stub")"
    done <<EOF
$(find "$ROOT/docs/product/features" -maxdepth 1 -name '*.md' 2>/dev/null)
EOF
fi

# ── FRD 참조 (ref, path) 추출 — 링크의 ref(브랜치/태그/커밋)를 보존 ──
FRD_REFS=$(CORPUS="$CORPUS" python3 <<'PYEOF' 2>/dev/null
import os, re
corpus = os.environ.get("CORPUS", "")
seen = set()
pattern = r'mechuri-docs/blob/([^/\s]+)/(products/\S+?/specs/frd/[^\s]+?\.md)'
for m in re.finditer(pattern, corpus):
    ref, path = m.group(1), m.group(2)
    if (ref, path) in seen:
        continue
    seen.add((ref, path))
    print(ref + "\t" + path)
PYEOF
)

if [ -n "$FRD_REFS" ]; then
    BLOCKED=""
    UNVERIFIED=""

    while IFS=$'\t' read -r ref path; do
        [ -z "$path" ] && continue
        RAW=$(gh api "repos/everyware-ie/mechuri-docs/contents/$path?ref=$ref" -H "Accept: application/vnd.github.raw" 2>/dev/null)
        if [ -z "$RAW" ]; then
            UNVERIFIED="${UNVERIFIED}  - $path @${ref} (허브 접근 실패 — 네트워크 또는 권한 확인)\n"
            continue
        fi
        STATUS=$(echo "$RAW" | grep -m1 -E "^status:" | sed -E 's/^status:[[:space:]]*//')
        if [ "$STATUS" != "approved" ]; then
            BLOCKED="${BLOCKED}  - $path @${ref} (현재 status: ${STATUS:-알수없음})\n"
        fi
    done <<< "$FRD_REFS"

    if [ -n "$BLOCKED" ]; then
        echo "[pre-pr-checklist] 이 PR이 참조하는 FRD가 아직 approved 상태가 아닙니다:" >&2
        echo -e "$BLOCKED" >&2
        echo "허브에서 팀 검토를 마치고 status: approved로 갱신한 뒤 PR을 생성하세요." >&2
        echo "(CLAUDE.md: approved 아닌 FRD는 구현 근거가 아니다)" >&2
        exit 2
    fi

    if [ -n "$UNVERIFIED" ]; then
        echo "[pre-pr-checklist] 경고 — 다음 FRD의 승인 상태를 확인하지 못했습니다 (차단하지 않음):" >&2
        echo -e "$UNVERIFIED" >&2
    fi
fi

# ── 이슈 실존 검증 — 스텁의 '이슈: #N'이 실제로 존재하는 이슈인지 확인 ──
# 스텁에 '이슈:' 줄이 있고 '없음'(소규모 면제)이 아니면, 참조한 #N을 실존 확인한다.
# (착수 게이트가 이미 '이슈:' 필드 존재는 강제하므로, 여기선 그 번호가 진짜인지만 본다)
# 네트워크 장애와 "이슈 없음"을 구분하려고 먼저 레포 접근 프로브를 한다 —
# 프로브가 실패하면(오프라인 등) 차단하지 않고 경고만 한다(FRD 게이트와 동일한 fail-open).
ISSUE_LINE=$(echo "$STUB_TEXT" | grep -E '^[-*]?[[:space:]]*이슈:' | head -1)
if [ -n "$ISSUE_LINE" ] && ! echo "$ISSUE_LINE" | grep -q '없음'; then
    ISSUE_NUMS=$(echo "$ISSUE_LINE" | grep -oE '#[0-9]+' | tr -d '#' | sort -u)
    if [ -n "$ISSUE_NUMS" ]; then
        if ! gh api repos/everyware-ie/kill-betting --jq .id >/dev/null 2>&1; then
            echo "[pre-pr-checklist] 경고 — GitHub 접근 실패로 이슈 실존을 확인하지 못했습니다 (차단하지 않음)." >&2
        else
            MISSING_ISSUES=""
            for num in $ISSUE_NUMS; do
                gh api "repos/everyware-ie/kill-betting/issues/$num" --jq .number >/dev/null 2>&1 \
                    || MISSING_ISSUES="${MISSING_ISSUES} #$num"
            done
            if [ -n "$MISSING_ISSUES" ]; then
                echo "[pre-pr-checklist] 스텁이 참조한 이슈가 존재하지 않습니다:${MISSING_ISSUES}" >&2
                echo "실제 GitHub 이슈로 분해했는지 확인하세요." >&2
                echo "(소규모라 이슈 분해가 불필요하면 스텁에 '이슈: 없음(소규모)'로 명시하세요)" >&2
                exit 2
            fi
        fi
    fi
fi

python3 -c "
import json
msg = '''[PR 생성 전 체크리스트]

- [ ] 브랜치 네이밍 준수? (형식: <작업자>/<타입>/<기능>)
- [ ] 라벨 붙였나? (커밋 타입과 동일 — chore/feat/fix/docs 등)
- [ ] 단일 목적 PR인가? (스코프 오염 없나)
- [ ] 관련 docs 업데이트 필요한 변경 완료하였는가?
- [ ] 세션 중 발견한 범위 외 내용들을 별도 깃허브 이슈로 기록해두었는가
- [ ] 관련 mechuri-docs FRD가 있다면 status: approved인가? (본문·스텁 링크로 자동 검증됨)
- [ ] 착수 전 이 기능을 GitHub 이슈로 분해했는가? (스텁 '이슈: #N', 소규모면 '없음(소규모)')'''
print(json.dumps({'systemMessage': msg}))
"

exit 0
