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

export interface RankedStanding extends Standing {
  group: string;
  position: number;
  goalDifference: number;
  qualificationStatus: QualificationStatus;
}

export interface StandingsSnapshot {
  groups: Record<string, RankedStanding[]>;
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

export const normalizeVenue = (stadium: string, city: string) => VENUE_NAME_MAP[stadium] ?? { stadium, city };

export const buildStandingsSnapshot = (standingsByGroup: Record<string, Standing[]>): StandingsSnapshot => {
  const sortedGroups = Object.fromEntries(
    Object.entries(standingsByGroup).map(([group, teams]) => [group, [...teams].sort(byTableOrder)]),
  ) as Record<string, Standing[]>;

  const thirdPlaceCandidates = Object.entries(sortedGroups)
    .map(([group, teams]) => ({ group, team: teams[2] }))
    .filter((entry): entry is { group: string; team: Standing } => Boolean(entry.team))
    .sort((a, b) => byTableOrder(a.team, b.team) || a.group.localeCompare(b.group));

  const bestThirdPlaceTeams = thirdPlaceCandidates
    .slice(0, 8)
    .map(({ group, team }) => toRankedStanding(group, team, 3, 'best-third'));

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
    bestThirdPlaceTeams,
  };
};
