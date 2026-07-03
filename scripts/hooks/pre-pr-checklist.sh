#!/bin/bash
# PreToolUse 훅 — gh pr create 감지 시 PR 체크리스트 자동 주입

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

if echo "$COMMAND" | grep -q "gh pr create"; then
    python3 -c "
import json
msg = '''[PR 생성 전 체크리스트]

- [ ] 브랜치 네이밍 준수? (형식: <작업자>/<타입>/<기능>)
- [ ] 라벨 붙였나? (커밋 타입과 동일 — chore/feat/fix/docs 등)
- [ ] 단일 목적 PR인가? (스코프 오염 없나)
- [ ] 관련 docs 업데이트 필요한 변경 완료하였는가?
- [ ] 세션 중 발견한 범위 외 내용들을 별도 깃허브 이슈로 기록해두었는가'''
print(json.dumps({'systemMessage': msg}))
"
fi

exit 0
