export interface FootballMatch {
  id: string;
  group: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  dateSgt: string;
  timeSgt: string;
  stadium: string;
  city: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
  minute: number;
}

export type MatchTab = 'all' | 'live' | 'upcoming' | 'finished';

const MONTH_TO_NUMBER: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

const updateMatchClockState = (match: FootballMatch, status: FootballMatch['status'], minute: number): FootballMatch => ({
  ...match,
  status,
  minute,
});

const parseSgtKickoff = (match: Pick<FootballMatch, 'dateSgt' | 'timeSgt'>, year: number) => {
  const [, month, day] = match.dateSgt.split(' ');
  const paddedDay = String(day || '').padStart(2, '0');
  const [time, meridiem] = match.timeSgt.split(' ');
  const [rawHour, minute] = time.split(':').map(Number);
  const normalizedHour = meridiem === 'PM'
    ? rawHour === 12 ? 12 : rawHour + 12
    : rawHour === 12 ? 0 : rawHour;

  return new Date(`${year}-${MONTH_TO_NUMBER[month]}-${paddedDay}T${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`);
};

const toMatchMinute = (elapsedMinutes: number) => {
  if (elapsedMinutes <= 0) {
    return 1;
  }

  if (elapsedMinutes <= 45) {
    return elapsedMinutes;
  }

  if (elapsedMinutes <= 60) {
    return 45;
  }

  return Math.min(90, elapsedMinutes - 15);
};

const toDisplayTimestamp = (match: Pick<FootballMatch, 'dateSgt' | 'timeSgt'>) => {
  const timestamp = parseSgtKickoff(match, 2026).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export const filterMatches = (matches: FootballMatch[], query: string, activeTab: MatchTab) => {
  const normalizedQuery = query.trim().toLowerCase();

  return matches.filter((match) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      match.homeTeam.toLowerCase().includes(normalizedQuery) ||
      match.awayTeam.toLowerCase().includes(normalizedQuery) ||
      match.group.toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) {
      return false;
    }

    return activeTab === 'all' ? true : match.status === activeTab;
  });
};

export const sortMatchesForDisplay = (matches: FootballMatch[], activeTab: MatchTab) => {
  if (activeTab === 'finished') {
    return [...matches].sort((a, b) => toDisplayTimestamp(b) - toDisplayTimestamp(a));
  }
  if (activeTab === 'upcoming') {
    return [...matches].sort((a, b) => toDisplayTimestamp(a) - toDisplayTimestamp(b));
  }

  return [...matches];
};

export const syncMatchStatuses = (matches: FootballMatch[], now: Date): FootballMatch[] => {
  const currentYear = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
    }).format(now),
  );

  return matches.map((match) => {
    const kickoff = parseSgtKickoff(match, currentYear);
    const elapsedMinutes = Math.floor((now.getTime() - kickoff.getTime()) / 60000);

    if (elapsedMinutes < 0) {
      return updateMatchClockState(match, 'upcoming', 0);
    }

    if (elapsedMinutes < 120) {
      return updateMatchClockState(match, 'live', toMatchMinute(elapsedMinutes));
    }

    if (match.status === 'finished') {
      return match;
    }

    return {
      ...match,
      status: 'finished',
      minute: 90,
    };
  });
};
