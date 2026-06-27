export interface MatchEvent {
  type: 'goal' | 'card-yellow' | 'card-red' | 'sub';
  time: number;
  team: 'home' | 'away';
  player: string;
  detail?: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
}

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
  events: MatchEvent[];
  stats: MatchStats;
}

export type MatchTab = 'all' | 'live' | 'upcoming' | 'finished';
export type AlertType = 'goal' | 'whistle' | 'card';

export interface MatchNotification {
  type: AlertType;
  message: string;
}

export interface MatchEngineResult {
  match: FootballMatch;
  notifications: MatchNotification[];
}

export interface MatchEngineOptions {
  random?: () => number;
}

const createEmptyStats = (): MatchStats => ({
  possession: [50, 50],
  shots: [0, 0],
  shotsOnTarget: [0, 0],
  corners: [0, 0],
  fouls: [0, 0],
});

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

const resetMatchState = (match: FootballMatch, status: FootballMatch['status'], minute: number): FootballMatch => ({
  ...match,
  status,
  minute,
  homeScore: 0,
  awayScore: 0,
  events: [],
  stats: createEmptyStats(),
});

const parseSgtKickoff = (match: Pick<FootballMatch, 'dateSgt' | 'timeSgt'>, year: number) => {
  const [, month, day] = match.dateSgt.split(' ');
  const [time, meridiem] = match.timeSgt.split(' ');
  const [rawHour, minute] = time.split(':').map(Number);
  const normalizedHour = meridiem === 'PM'
    ? rawHour === 12 ? 12 : rawHour + 12
    : rawHour === 12 ? 0 : rawHour;

  return new Date(`${year}-${MONTH_TO_NUMBER[month]}-${day}T${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`);
};

const cloneStats = (stats: MatchStats): MatchStats => ({
  possession: [...stats.possession] as [number, number],
  shots: [...stats.shots] as [number, number],
  shotsOnTarget: [...stats.shotsOnTarget] as [number, number],
  corners: [...stats.corners] as [number, number],
  fouls: [...stats.fouls] as [number, number],
});

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

const createGoalScorer = (match: FootballMatch, scoringTeam: 'home' | 'away') => {
  if (scoringTeam === 'home') {
    return match.homeTeam === 'Panama' ? 'Cecilio Waterman' : 'Inaki Williams';
  }

  return match.awayTeam === 'England' ? 'Bukayo Saka' : 'Jordan Ayew';
};

const createCardedPlayer = (match: FootballMatch, team: 'home' | 'away') => {
  if (team === 'home') {
    return match.homeTeam === 'Panama' ? 'Michael Murillo' : 'Luka Modrić';
  }

  return match.awayTeam === 'England' ? 'Declan Rice' : 'Thomas Partey';
};

export const createOrderedEvents = (events: MatchEvent[]) =>
  [...events].sort((a, b) => b.time - a.time);

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
      return resetMatchState(match, 'upcoming', 0);
    }

    if (elapsedMinutes < 120) {
      if (match.status === 'upcoming') {
        return {
          ...resetMatchState(match, 'live', toMatchMinute(elapsedMinutes)),
        };
      }

      return {
        ...match,
        status: 'live',
        minute: toMatchMinute(elapsedMinutes),
      };
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

export const advanceLiveMatch = (
  match: FootballMatch,
  { random = Math.random }: MatchEngineOptions = {},
): MatchEngineResult => {
  if (match.status !== 'live') {
    return { match, notifications: [] };
  }

  const nextMin = match.minute + 1;
  const isFullTime = nextMin >= 90;
  const roll = random();
  const events = [...match.events];
  const stats = cloneStats(match.stats);
  const notifications: MatchNotification[] = [];
  let homeScore = match.homeScore;
  let awayScore = match.awayScore;

  const posShift = Math.floor(random() * 5) - 2;
  const newPos = Math.min(80, Math.max(20, stats.possession[0] + posShift));
  stats.possession = [newPos, 100 - newPos];

  if (roll < 0.15) {
    const isHomeShot = random() > 0.55;
    if (isHomeShot) {
      stats.shots[0] += 1;
      if (random() > 0.4) {
        stats.shotsOnTarget[0] += 1;
      }
    } else {
      stats.shots[1] += 1;
      if (random() > 0.4) {
        stats.shotsOnTarget[1] += 1;
      }
    }
  }

  if (roll < 0.05) {
    const scoringTeam = random() > 0.55 ? 'home' : 'away';
    const scorer = createGoalScorer(match, scoringTeam);

    if (scoringTeam === 'home') {
      homeScore += 1;
      stats.shots[0] += 1;
      stats.shotsOnTarget[0] += 1;
    } else {
      awayScore += 1;
      stats.shots[1] += 1;
      stats.shotsOnTarget[1] += 1;
    }

    events.push({
      type: 'goal',
      time: nextMin,
      team: scoringTeam,
      player: scorer,
      detail: scoringTeam === 'home' ? 'Brilliant tap-in' : 'Stunning curling shot',
    });

    notifications.push({
      type: 'goal',
      message: `⚽ GOAL! ${scoringTeam === 'home' ? match.homeTeam : match.awayTeam} score! (${scorer} - ${nextMin}')`,
    });
  } else if (roll < 0.08) {
    const cardTeam = random() > 0.5 ? 'home' : 'away';
    const player = createCardedPlayer(match, cardTeam);

    events.push({
      type: 'card-yellow',
      time: nextMin,
      team: cardTeam,
      player,
    });

    notifications.push({
      type: 'card',
      message: `🟨 YELLOW CARD! ${player} (${cardTeam === 'home' ? match.homeTeam : match.awayTeam})`,
    });
  }

  if (isFullTime) {
    notifications.push({
      type: 'whistle',
      message: `🏁 FULL TIME! ${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}`,
    });
  }

  return {
    match: {
      ...match,
      minute: isFullTime ? 90 : nextMin,
      status: isFullTime ? 'finished' : 'live',
      homeScore,
      awayScore,
      events,
      stats,
    },
    notifications,
  };
};

export const injectManualGoal = (
  match: FootballMatch,
  scoringTeam: 'home' | 'away',
  goalMinute: number,
): FootballMatch => {
  const stats = cloneStats(match.stats);

  if (scoringTeam === 'home') {
    stats.shots[0] += 1;
    stats.shotsOnTarget[0] += 1;
  } else {
    stats.shots[1] += 1;
    stats.shotsOnTarget[1] += 1;
  }

  return {
    ...match,
    homeScore: scoringTeam === 'home' ? match.homeScore + 1 : match.homeScore,
    awayScore: scoringTeam === 'away' ? match.awayScore + 1 : match.awayScore,
    events: [
      ...match.events,
      {
        type: 'goal',
        time: goalMinute,
        team: scoringTeam,
        player: scoringTeam === 'home' ? `${match.homeTeam} Striker` : `${match.awayTeam} Winger`,
        detail: 'Powerful header from deep cross',
      },
    ],
    stats,
  };
};

export const makeMatchLive = (match: FootballMatch): FootballMatch => ({
  ...match,
  status: 'live',
  minute: 1,
  homeScore: 0,
  awayScore: 0,
  events: [],
  stats: createEmptyStats(),
});
