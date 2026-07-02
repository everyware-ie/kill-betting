#!/usr/bin/env python3
"""현재 세션의 AI 메타데이터를 출력한다. PR 본문 작성 시 활용."""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path.home() / ".claude" / "projects"

def find_session_dir(cwd: str) -> Path | None:
    slug = cwd.replace("/", "-").lstrip("-")
    candidate = PROJECT_DIR / slug
    if candidate.exists():
        return candidate
    # 부분 매치 시도
    for d in PROJECT_DIR.iterdir():
        if slug.endswith(d.name) or d.name.endswith(slug.split("-")[-1]):
            return d
    return None

def parse_session(jsonl_path: Path) -> dict:
    total_input = total_output = cache_read = cache_write = turns = 0
    timestamps = []

    with open(jsonl_path) as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            line = json.loads(raw)
            if "timestamp" in line:
                timestamps.append(line["timestamp"])
            if line.get("type") == "assistant" and "message" in line:
                u = line["message"].get("usage", {})
                if u:
                    total_input += u.get("input_tokens", 0)
                    total_output += u.get("output_tokens", 0)
                    cache_read += u.get("cache_read_input_tokens", 0)
                    cache_write += u.get("cache_creation_input_tokens", 0)
                    turns += 1

    duration = ""
    if len(timestamps) >= 2:
        fmt = "%Y-%m-%dT%H:%M:%S.%fZ"
        try:
            start = datetime.strptime(timestamps[0], fmt)
            end = datetime.strptime(timestamps[-1], fmt)
            diff = end - start
            h, m = divmod(int(diff.total_seconds()) // 60, 60)
            duration = f"약 {h}시간 {m}분" if h else f"약 {m}분"
            start_str = start.strftime("%Y-%m-%d %H:%M")
            end_str = end.strftime("%H:%M")
        except:
            start_str = end_str = "-"
    else:
        start_str = end_str = "-"

    return {
        "turns": turns,
        "output_tokens": total_output,
        "cache_read": cache_read,
        "cache_write": cache_write,
        "input_tokens": total_input,
        "start": start_str,
        "end": end_str,
        "duration": duration,
    }

def main():
    cwd = os.getcwd()
    session_dir = find_session_dir(cwd)
    if not session_dir:
        print(f"세션 디렉토리를 찾을 수 없습니다: {cwd}", file=sys.stderr)
        sys.exit(1)

    jsonl_files = sorted(session_dir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not jsonl_files:
        print("세션 파일이 없습니다.", file=sys.stderr)
        sys.exit(1)

    s = parse_session(jsonl_files[0])

    print("## AI 메타데이터")
    print()
    print("| 항목 | 값 |")
    print("|------|-----|")
    print(f"| 모델 | claude-sonnet-4-6 |")
    print(f"| 세션 시간 | {s['start']} → {s['end']} ({s['duration']}) |")
    print(f"| 턴 수 | {s['turns']:,}회 |")
    print(f"| 생성 토큰 | {s['output_tokens']:,} |")
    print(f"| 컨텍스트 누적 읽기 | {s['cache_read']:,} (캐시 히트) |")
    print(f"| 신규 컨텍스트 추가 | {s['cache_write']:,} |")

if __name__ == "__main__":
    main()
