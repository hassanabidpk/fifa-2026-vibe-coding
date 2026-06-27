export interface FifaStandingRow {
  rank: number;
  team: string;
  code: string;
  group?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  teamConductScore: number;
  points: number;
}

export interface FifaStandingsData {
  groups: Record<string, FifaStandingRow[]>;
  thirdPlace: FifaStandingRow[];
}

const GROUP_NAMES = Array.from({ length: 12 }, (_, index) => `Group ${String.fromCharCode(65 + index)}`);
const GROUP_HEADER = /Standings and Group Tables - (Group [A-L])/g;
const GROUP_ROW = /(\d{1,2}) (.+?) ([A-Z]{3}) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (-?\d+) (-?\d+) (\d+)/g;
const THIRD_PLACE_HEADER = 'Third place standings';
const THIRD_PLACE_ROW = /(\d{1,2}) (.+?) ([A-Z]{3}) (Group [A-L]) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (-?\d+) (-?\d+) (\d+)/g;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const parseGroupRows = (segment: string): FifaStandingRow[] => {
  const rows: FifaStandingRow[] = [];

  for (const match of segment.matchAll(GROUP_ROW)) {
    rows.push({
      rank: Number(match[1]),
      team: normalizeWhitespace(match[2]),
      code: match[3],
      played: Number(match[4]),
      won: Number(match[5]),
      drawn: Number(match[6]),
      lost: Number(match[7]),
      goalsFor: Number(match[8]),
      goalsAgainst: Number(match[9]),
      goalDifference: Number(match[10]),
      teamConductScore: Number(match[11]),
      points: Number(match[12]),
    });
  }

  return rows.slice(0, 4);
};

export const parseFifaStandingsText = (text: string): FifaStandingsData => {
  const normalized = normalizeWhitespace(text);
  const groups: Record<string, FifaStandingRow[]> = {};

  const headers = [...normalized.matchAll(GROUP_HEADER)];
  headers.forEach((header, index) => {
    const groupName = header[1];
    const start = header.index ?? 0;
    const end = headers[index + 1]?.index ?? normalized.indexOf(THIRD_PLACE_HEADER);
    const segment = normalized.slice(start, end === -1 ? normalized.length : end);
    groups[groupName] = parseGroupRows(segment);
  });

  const thirdPlaceStart = normalized.indexOf(THIRD_PLACE_HEADER);
  const thirdPlaceSegment = thirdPlaceStart === -1 ? '' : normalized.slice(thirdPlaceStart);
  const thirdPlace = [...thirdPlaceSegment.matchAll(THIRD_PLACE_ROW)].map((match) => ({
    rank: Number(match[1]),
    team: normalizeWhitespace(match[2]),
    code: match[3],
    group: match[4],
    played: Number(match[5]),
    won: Number(match[6]),
    drawn: Number(match[7]),
    lost: Number(match[8]),
    goalsFor: Number(match[9]),
    goalsAgainst: Number(match[10]),
    goalDifference: Number(match[11]),
    teamConductScore: Number(match[12]),
    points: Number(match[13]),
  }));

  const orderedGroups = Object.fromEntries(
    GROUP_NAMES.filter((groupName) => groups[groupName]?.length === 4).map((groupName) => [groupName, groups[groupName]]),
  );

  return {
    groups: orderedGroups,
    thirdPlace,
  };
};
