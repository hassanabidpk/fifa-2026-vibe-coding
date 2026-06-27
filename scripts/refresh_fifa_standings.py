from __future__ import annotations

import html
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parents[1]
STANDINGS_OUTPUT_PATH = REPO_ROOT / 'src' / 'data' / 'fifa-standings.ts'
FIXTURES_OUTPUT_PATH = REPO_ROOT / 'src' / 'data' / 'fifa-fixtures.ts'
STANDINGS_URL = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings'
FIXTURES_SECTION_URL = 'https://cxm-api.fifa.com/fifaplusweb/api/sections/article/S9YG2JmeGYaMUCBbm0CcD?locale=en'
STANDINGS_START_MARKER = 'Standings and Group Tables - Group A'
END_MARKERS = ['Your Privacy', 'Cookies Settings', 'Privacy Preference Center']
KNOCKOUT_STAGE_MAP = {
    'FIFA World Cup 2026 – Round of 32 fixtures': 'Round of 32',
    'FIFA World Cup 2026 Round of 16 fixtures': 'Round of 16',
    'FIFA World Cup 2026 quarter-final fixtures': 'Quarterfinals',
    'FIFA World Cup 2026 semi-final fixtures': 'Semifinals',
    'FIFA World Cup 2026 bronze final': 'Third Place',
    'FIFA World Cup 2026 Final': 'Final',
}
DEFAULT_CHROME_CANDIDATES = [
    os.environ.get('CHROME_BIN', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
]


class ScriptError(RuntimeError):
    pass


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


def fetch_text(url: str) -> str:
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=60) as response:
        return response.read().decode('utf-8', 'ignore')


def fetch_json(url: str) -> dict:
    return json.loads(fetch_text(url))


def dump_dom(chrome_bin: str, url: str, *, budget_ms: int = 15000) -> str:
    result = subprocess.run(
        [
            chrome_bin,
            '--headless=new',
            '--disable-gpu',
            f'--virtual-time-budget={budget_ms}',
            '--dump-dom',
            url,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def clean_dom_text(dom: str) -> str:
    clean = re.sub(r'<script.*?</script>', ' ', dom, flags=re.S | re.I)
    clean = re.sub(r'<style.*?</style>', ' ', clean, flags=re.S | re.I)
    clean = re.sub(r'<[^>]+>', ' ', clean)
    return html.unescape(re.sub(r'\s+', ' ', clean)).strip()


def extract_standings_segment(dom: str) -> str:
    clean = clean_dom_text(dom)
    start = clean.find(STANDINGS_START_MARKER)
    if start == -1:
        raise ScriptError(f'Start marker not found: {STANDINGS_START_MARKER}')

    segment = clean[start:]
    end_positions = [segment.find(marker) for marker in END_MARKERS if segment.find(marker) != -1]
    if end_positions:
        segment = segment[: min(end_positions)]

    return segment.strip()


def format_date_label(date_obj: datetime) -> str:
    return f"{date_obj.strftime('%a')}, {date_obj.strftime('%b')} {date_obj.day}"


def format_time_label(value: str) -> str:
    return datetime.strptime(value, '%H:%M').strftime('%I:%M %p')


def normalize_text(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


def get_node_text(node: dict) -> str:
    if node.get('nodeType') == 'text':
        return node.get('value', '')
    return ''.join(get_node_text(child) for child in node.get('content', []))


def split_paragraph_lines(node: dict) -> list[list[tuple[str, str, str]]]:
    lines: list[list[tuple[str, str, str]]] = [[]]
    for child in node.get('content', []):
        if child.get('nodeType') == 'hyperlink':
            lines[-1].append(('link', normalize_text(get_node_text(child)), child.get('data', {}).get('uri', '')))
            continue

        value = child.get('value', '')
        parts = value.split('\n')
        for index, part in enumerate(parts):
            if part:
                lines[-1].append(('text', part, ''))
            if index != len(parts) - 1:
                lines.append([])

    return [line for line in lines if normalize_text(''.join(token[1] for token in line))]


def parse_match_label(label: str) -> tuple[str, str, str, int, int]:
    if ' v ' in label:
        home, away = label.split(' v ', 1)
        return normalize_text(home), normalize_text(away), 'upcoming', 0, 0

    match = re.match(r'^(.*?)\s+(\d+)-(\d+)\s+(.*?)$', label)
    if not match:
        raise ScriptError(f'Unable to parse match label: {label}')

    home, home_score, away_score, away = match.groups()
    return normalize_text(home), normalize_text(away), 'finished', int(home_score), int(away_score)


def parse_fixture_line(tokens: list[tuple[str, str, str]], current_stage: str) -> dict:
    link_index = next((index for index, token in enumerate(tokens) if token[0] == 'link'), None)
    if link_index is None:
        raise ScriptError('Fixture line missing hyperlink token')

    prefix = normalize_text(''.join(token[1] for token in tokens[:link_index]))
    label = tokens[link_index][1]
    source_url = tokens[link_index][2]
    suffix = normalize_text(''.join(token[1] for token in tokens[link_index + 1 :]))

    match_number = None
    match_number_match = re.match(r'^Match\s+(\d+)\s*[–-]?$', prefix)
    if match_number_match:
        match_number = int(match_number_match.group(1))

    if current_stage == 'Group Stage':
        stage_match = re.search(r'[-–]\s*(Group\s+[A-L])\s*[-–]\s*(.+)$', suffix)
        if not stage_match:
            raise ScriptError(f'Unable to parse group-stage suffix: {suffix}')
        group = stage_match.group(1)
        stadium = normalize_text(stage_match.group(2))
    else:
        group = current_stage
        stadium = normalize_text(re.sub(r'^[-–]\s*', '', suffix))

    home_team, away_team, status, home_score, away_score = parse_match_label(label)

    return {
        'sourceUrl': source_url,
        'matchNumber': match_number,
        'group': group,
        'homeTeam': home_team,
        'awayTeam': away_team,
        'dateSgt': '',
        'timeSgt': '',
        'stadium': stadium,
        'city': '',
        'status': status,
        'homeScore': home_score,
        'awayScore': away_score,
    }


def parse_fixture_article(payload: dict) -> list[dict]:
    fixtures: list[dict] = []
    current_stage = ''

    for node in payload.get('richtext', {}).get('content', []):
        node_type = node.get('nodeType')
        text = normalize_text(get_node_text(node).replace('\xa0', ' '))

        if node_type == 'heading-3':
            if text == 'FIFA World Cup 2026 Group Stage results and fixtures':
                current_stage = 'Group Stage'
            else:
                current_stage = KNOCKOUT_STAGE_MAP.get(text, current_stage)
            continue

        if node_type != 'paragraph' or not current_stage:
            continue

        for line in split_paragraph_lines(node):
            line_text = normalize_text(''.join(token[1] for token in line))
            if not line_text or ' - ' not in line_text and ' – ' not in line_text:
                continue
            fixtures.append(parse_fixture_line(line, current_stage))

    if len(fixtures) < 100:
        raise ScriptError(f'Expected 100+ fixtures, found {len(fixtures)}')

    return fixtures


def load_existing_fixtures() -> dict[str, dict]:
    if not FIXTURES_OUTPUT_PATH.exists():
        return {}

    text = FIXTURES_OUTPUT_PATH.read_text()
    match = re.search(r'String\.raw`(.*)`;', text, flags=re.S)
    if not match:
        return {}

    raw_json = match.group(1).replace('\\`', '`')
    fixtures = json.loads(raw_json)
    return {fixture['sourceUrl']: fixture for fixture in fixtures}


def parse_match_page_details(dom: str) -> tuple[str, str, str, str]:
    clean = clean_dom_text(dom)
    match = re.search(
        r'Kick Off\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4}),\s+(\d{2}:\d{2})\s+Location\s+(.+?)\s+City\s+(.+?)\s+(?:Referee|Fourth official|Competition)',
        clean,
    )
    if not match:
        raise ScriptError('Unable to parse match page kickoff details')

    date_value, time_value, stadium, city = match.groups()
    date_obj = datetime.strptime(date_value, '%d %B %Y')
    return format_date_label(date_obj), format_time_label(time_value), normalize_text(stadium), normalize_text(city)


def hydrate_fixture_details(chrome_bin: str, fixtures: list[dict]) -> None:
    existing = load_existing_fixtures()
    scraped = 0

    for fixture in fixtures:
        previous = existing.get(fixture['sourceUrl'])
        if previous:
            fixture['dateSgt'] = previous.get('dateSgt', '')
            fixture['timeSgt'] = previous.get('timeSgt', '')
            fixture['city'] = previous.get('city', '')

        if previous and fixture['matchNumber'] is None:
            continue

        if fixture['matchNumber'] is None:
            continue

        if fixture['dateSgt'] and fixture['timeSgt'] and fixture['city']:
            continue

        dom = dump_dom(chrome_bin, fixture['sourceUrl'], budget_ms=12000)
        date_sgt, time_sgt, stadium, city = parse_match_page_details(dom)
        fixture['dateSgt'] = date_sgt
        fixture['timeSgt'] = time_sgt
        fixture['stadium'] = stadium or fixture['stadium']
        fixture['city'] = city
        scraped += 1

    print(f'FIXTURE_PAGES_SCRAPED={scraped}')


def render_fixtures_module(fixtures: list[dict]) -> str:
    payload = json.dumps(fixtures, ensure_ascii=False, indent=2)
    payload = payload.replace('`', '\\`')
    return (
        "export interface OfficialFixtureSeed {\n"
        "  sourceUrl: string;\n"
        "  matchNumber: number | null;\n"
        "  group: string;\n"
        "  homeTeam: string;\n"
        "  awayTeam: string;\n"
        "  dateSgt: string;\n"
        "  timeSgt: string;\n"
        "  stadium: string;\n"
        "  city: string;\n"
        "  status: 'upcoming' | 'finished';\n"
        "  homeScore: number;\n"
        "  awayScore: number;\n"
        "}\n\n"
        f"const OFFICIAL_FIFA_FIXTURES_JSON = String.raw`{payload}`;\n\n"
        "export const OFFICIAL_FIFA_FIXTURES = JSON.parse(\n"
        "  OFFICIAL_FIFA_FIXTURES_JSON,\n"
        ") as OfficialFixtureSeed[];\n"
    )


def write_output(path: Path, content: str) -> bool:
    previous = path.read_text() if path.exists() else None
    path.write_text(content)
    return previous != content


def main() -> int:
    chrome_bin = resolve_chrome()

    standings_dom = dump_dom(chrome_bin, STANDINGS_URL)
    standings_segment = extract_standings_segment(standings_dom)
    standings_changed = write_output(
        STANDINGS_OUTPUT_PATH,
        f'export const OFFICIAL_FIFA_STANDINGS_TEXT = {standings_segment!r};\n',
    )

    fixtures_payload = fetch_json(FIXTURES_SECTION_URL)
    fixtures = parse_fixture_article(fixtures_payload)
    hydrate_fixture_details(chrome_bin, fixtures)
    fixtures_changed = write_output(FIXTURES_OUTPUT_PATH, render_fixtures_module(fixtures))

    print(f'CHROME_BIN={chrome_bin}')
    print(f'STANDINGS_TEXT_LENGTH={len(standings_segment)}')
    print(f'FIXTURE_COUNT={len(fixtures)}')
    print(f'STANDINGS_CHANGED={1 if standings_changed else 0}')
    print(f'FIXTURES_CHANGED={1 if fixtures_changed else 0}')
    print(f'CHANGED={1 if standings_changed or fixtures_changed else 0}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
