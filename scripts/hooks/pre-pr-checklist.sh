#!/bin/bash
# PreToolUse 훅 — gh pr create 감지 시 PR 체크리스트 자동 주입 + FRD 승인 상태 게이트
#
# 게이트: PR 본문에 mechuri-docs FRD 링크가 있으면, 그 FRD의 status가
# approved가 아닐 경우 PR 생성을 차단한다 (exit 2). FRD 링크가 없는 PR은
# 검사 대상이 아니다 (chore/docs 등 FRD와 무관한 변경).
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

# ── FRD 승인 상태 게이트 ──
FRD_PATHS=$(echo "$COMMAND" | grep -oE "mechuri-docs/blob/[^)\"' ]+/products/[^)\"' ]+/specs/frd/[^)\"' ]+\.md" | sed -E 's#^mechuri-docs/blob/[^/]+/##')

if [ -n "$FRD_PATHS" ]; then
    BLOCKED=""
    UNVERIFIED=""

    while IFS= read -r path; do
        [ -z "$path" ] && continue
        RAW=$(gh api "repos/everyware-ie/mechuri-docs/contents/$path" -H "Accept: application/vnd.github.raw" 2>/dev/null)
        if [ -z "$RAW" ]; then
            UNVERIFIED="${UNVERIFIED}  - $path (허브 접근 실패 — 네트워크 또는 권한 확인)\n"
            continue
        fi
        STATUS=$(echo "$RAW" | grep -m1 -E "^status:" | sed -E 's/^status:[[:space:]]*//')
        if [ "$STATUS" != "approved" ]; then
            BLOCKED="${BLOCKED}  - $path (현재 status: ${STATUS:-알수없음})\n"
        fi
    done <<< "$FRD_PATHS"

    if [ -n "$BLOCKED" ]; then
        echo "[pre-pr-checklist] PR 본문이 참조하는 FRD가 아직 approved 상태가 아닙니다:" >&2
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

python3 -c "
import json
msg = '''[PR 생성 전 체크리스트]

- [ ] 브랜치 네이밍 준수? (형식: <작업자>/<타입>/<기능>)
- [ ] 라벨 붙였나? (커밋 타입과 동일 — chore/feat/fix/docs 등)
- [ ] 단일 목적 PR인가? (스코프 오염 없나)
- [ ] 관련 docs 업데이트 필요한 변경 완료하였는가?
- [ ] 세션 중 발견한 범위 외 내용들을 별도 깃허브 이슈로 기록해두었는가
- [ ] 관련 mechuri-docs FRD가 있다면 status: approved인가? (본문에 링크 시 자동 검증됨)'''
print(json.dumps({'systemMessage': msg}))
"

exit 0
