export interface Standing {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export type QualificationStatus = 'qualified' | 'best-third' | 'eliminated';

export interface GroupMatchLike {
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  status: 'upcoming' | 'live' | 'finished';
}

export interface RankedStanding extends Standing {
  group: string;
  position: number;
  goalDifference: number;
  qualificationStatus: QualificationStatus;
}

export interface StandingsSnapshot {
  groups: Record<string, RankedStanding[]>;
  thirdPlaceTeams: RankedStanding[];
  bestThirdPlaceTeams: RankedStanding[];
}

const VENUE_NAME_MAP: Record<string, { stadium: string; city: string }> = {
  'MetLife Stadium': { stadium: 'New York New Jersey Stadium', city: 'New York / New Jersey' },
  'Mercedes-Benz Stadium': { stadium: 'Atlanta Stadium', city: 'Atlanta' },
  'Hard Rock Stadium': { stadium: 'Miami Stadium', city: 'Miami' },
  'Gillette Stadium': { stadium: 'Boston Stadium', city: 'Boston' },
  'Lincoln Financial Field': { stadium: 'Philadelphia Stadium', city: 'Philadelphia' },
  'Levi Stadium': { stadium: 'San Francisco Bay Area Stadium', city: 'San Francisco Bay Area' },
  'NRG Stadium': { stadium: 'Houston Stadium', city: 'Houston' },
  'AT&T Stadium': { stadium: 'Dallas Stadium', city: 'Dallas' },
  'SoFi Stadium': { stadium: 'Los Angeles Stadium', city: 'Los Angeles' },
  'Arrowhead Stadium': { stadium: 'Kansas City Stadium', city: 'Kansas City' },
  'BC Place': { stadium: 'Vancouver Stadium', city: 'Vancouver' },
};

const byTableOrder = (a: Standing, b: Standing) =>
  b.points - a.points ||
  (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
  b.goalsFor - a.goalsFor ||
  a.team.localeCompare(b.team);

const toRankedStanding = (
  group: string,
  team: Standing,
  position: number,
  qualificationStatus: QualificationStatus,
): RankedStanding => ({
  ...team,
  group,
  position,
  goalDifference: team.goalsFor - team.goalsAgainst,
  qualificationStatus,
});

const createEmptyStanding = (team: string, flag: string): Standing => ({
  team,
  flag,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

const ensureTeamStanding = (groupTable: Record<string, Standing>, team: string, flag: string): Standing => {
  groupTable[team] ??= createEmptyStanding(team, flag);
  return groupTable[team];
};

const updateStandingFromScore = (team: Standing, goalsFor: number, goalsAgainst: number) => {
  team.played += 1;
  team.goalsFor += goalsFor;
  team.goalsAgainst += goalsAgainst;

  if (goalsFor > goalsAgainst) {
    team.won += 1;
    team.points += 3;
    return;
  }

  if (goalsFor < goalsAgainst) {
    team.lost += 1;
    return;
  }

  team.drawn += 1;
  team.points += 1;
};

export const buildStandingsFromMatches = (matches: GroupMatchLike[]): Record<string, Standing[]> => {
  const standingsByGroup = matches.reduce<Record<string, Record<string, Standing>>>((groups, match) => {
    if (!match.group.startsWith('Group ') || match.status === 'upcoming') {
      return groups;
    }

    groups[match.group] ??= {};
    const groupTable = groups[match.group];
    const home = ensureTeamStanding(groupTable, match.homeTeam, match.homeFlag);
    const away = ensureTeamStanding(groupTable, match.awayTeam, match.awayFlag);

    updateStandingFromScore(home, match.homeScore, match.awayScore);
    updateStandingFromScore(away, match.awayScore, match.homeScore);

    return groups;
  }, {});

  return Object.fromEntries(
    Object.entries(standingsByGroup).map(([group, teams]) => [group, Object.values(teams).sort(byTableOrder)]),
  ) as Record<string, Standing[]>;
};

export const normalizeVenue = (stadium: string, city: string) => VENUE_NAME_MAP[stadium] ?? { stadium, city };

export const buildStandingsSnapshot = (standingsByGroup: Record<string, Standing[]>): StandingsSnapshot => {
  const sortedGroups = Object.fromEntries(
    Object.entries(standingsByGroup).map(([group, teams]) => [group, [...teams].sort(byTableOrder)]),
  ) as Record<string, Standing[]>;

  const thirdPlaceCandidates = Object.entries(sortedGroups)
    .map(([group, teams]) => ({ group, team: teams[2] }))
    .filter((entry): entry is { group: string; team: Standing } => Boolean(entry.team))
    .sort((a, b) => byTableOrder(a.team, b.team) || a.group.localeCompare(b.group));

  const thirdPlaceTeams = thirdPlaceCandidates.map(({ group, team }) => toRankedStanding(group, team, 3, 'eliminated'));
  const bestThirdPlaceTeams = thirdPlaceTeams.slice(0, 8).map((team) => ({
    ...team,
    qualificationStatus: 'best-third' as const,
  }));

  const bestThirdKeys = new Set(bestThirdPlaceTeams.map((team) => `${team.group}:${team.team}`));

  const groups = Object.fromEntries(
    Object.entries(sortedGroups).map(([group, teams]) => [
      group,
      teams.map((team, index) => {
        const qualificationStatus: QualificationStatus =
          index < 2 ? 'qualified' : bestThirdKeys.has(`${group}:${team.team}`) ? 'best-third' : 'eliminated';

        return toRankedStanding(group, team, index + 1, qualificationStatus);
      }),
    ]),
  ) as Record<string, RankedStanding[]>;

  return {
    groups,
    thirdPlaceTeams,
    bestThirdPlaceTeams,
  };
};
