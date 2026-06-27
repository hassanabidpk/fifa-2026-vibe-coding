from __future__ import annotations

import html
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = REPO_ROOT / 'src' / 'data' / 'fifa-standings.ts'
URL = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings'
START_MARKER = 'Standings and Group Tables - Group A'
END_MARKERS = ['Your Privacy', 'Cookies Settings', 'Privacy Preference Center']
DEFAULT_CHROME_CANDIDATES = [
    os.environ.get('CHROME_BIN', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
]


def resolve_chrome() -> str:
    for candidate in DEFAULT_CHROME_CANDIDATES:
        if not candidate:
            continue
        if '/' in candidate:
            if Path(candidate).exists():
                return candidate
        else:
            from shutil import which
            if which(candidate):
                return candidate
    raise SystemExit('Could not find a Chrome/Chromium binary. Set CHROME_BIN.')


def dump_dom(chrome_bin: str) -> str:
    result = subprocess.run(
        [
            chrome_bin,
            '--headless=new',
            '--disable-gpu',
            '--virtual-time-budget=15000',
            '--dump-dom',
            URL,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def extract_segment(dom: str) -> str:
    clean = re.sub(r'<script.*?</script>', ' ', dom, flags=re.S | re.I)
    clean = re.sub(r'<style.*?</style>', ' ', clean, flags=re.S | re.I)
    clean = re.sub(r'<[^>]+>', ' ', clean)
    clean = html.unescape(re.sub(r'\s+', ' ', clean)).strip()

    start = clean.find(START_MARKER)
    if start == -1:
        raise SystemExit(f'Start marker not found: {START_MARKER}')

    segment = clean[start:]
    end_positions = [segment.find(marker) for marker in END_MARKERS if segment.find(marker) != -1]
    if end_positions:
        segment = segment[: min(end_positions)]

    return segment.strip()


def write_output(segment: str) -> bool:
    content = f'export const OFFICIAL_FIFA_STANDINGS_TEXT = {segment!r};\n'
    previous = OUTPUT_PATH.read_text() if OUTPUT_PATH.exists() else None
    OUTPUT_PATH.write_text(content)
    return previous != content


def main() -> int:
    chrome_bin = resolve_chrome()
    dom = dump_dom(chrome_bin)
    segment = extract_segment(dom)
    changed = write_output(segment)
    print(f'CHROME_BIN={chrome_bin}')
    print(f'STANDINGS_TEXT_LENGTH={len(segment)}')
    print(f'CHANGED={1 if changed else 0}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
