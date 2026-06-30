export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface LegacyMatchSeed {
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
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export interface OfficialFixtureSeed {
  sourceUrl: string;
  matchNumber: number | null;
  group: string;
  homeTeam: string;
  awayTeam: string;
  dateSgt: string;
  timeSgt: string;
  stadium: string;
  city: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();
const normalizeKey = (value: string) => normalizeWhitespace(value).toLowerCase();
export const toTeamLookupKey = (value: string) =>
  normalizeWhitespace(value)
    .replace(/[‘’]/g, "'")
    .replace(/\s*\([^)]*\)\s*$/, '')
    .toLowerCase();
const isPlaceholderTeam = (team: string) => /^(Group\s+[A-Z]|Winner\s+match|Runner-up\s+match)/i.test(team);
const buildFixtureKey = (fixture: Pick<OfficialFixtureSeed, 'group' | 'homeTeam' | 'awayTeam' | 'stadium'>) =>
  [
    normalizeKey(fixture.group),
    toTeamLookupKey(fixture.homeTeam),
    toTeamLookupKey(fixture.awayTeam),
    normalizeKey(fixture.stadium),
  ].join('::');

export const buildOfficialMatchSeeds = (
  legacyMatches: LegacyMatchSeed[],
  officialFixtures: OfficialFixtureSeed[],
): LegacyMatchSeed[] => {
  const legacyByFixtureKey = new Map(legacyMatches.map((match) => [buildFixtureKey(match), match]));
  const teamFlags = new Map<string, string>();

  for (const match of legacyMatches) {
    teamFlags.set(toTeamLookupKey(match.homeTeam), match.homeFlag);
    teamFlags.set(toTeamLookupKey(match.awayTeam), match.awayFlag);
  }

  return officialFixtures.map((fixture, index) => {
    const legacyMatch = legacyByFixtureKey.get(buildFixtureKey(fixture));
    const homeFlag =
      teamFlags.get(toTeamLookupKey(fixture.homeTeam)) ??
      legacyMatch?.homeFlag ??
      (isPlaceholderTeam(fixture.homeTeam) ? '🏆' : '🏳️');
    const awayFlag =
      teamFlags.get(toTeamLookupKey(fixture.awayTeam)) ??
      legacyMatch?.awayFlag ??
      (isPlaceholderTeam(fixture.awayTeam) ? '🏆' : '🏳️');

    return {
      id: legacyMatch?.id ?? `m${fixture.matchNumber ?? index + 1}`,
      group: fixture.group,
      homeTeam: normalizeWhitespace(fixture.homeTeam),
      homeFlag,
      awayTeam: normalizeWhitespace(fixture.awayTeam),
      awayFlag,
      dateSgt: fixture.dateSgt || legacyMatch?.dateSgt || '',
      timeSgt: fixture.timeSgt || legacyMatch?.timeSgt || '12:00 AM',
      stadium: fixture.stadium || legacyMatch?.stadium || '',
      city: fixture.city || legacyMatch?.city || '',
      status: fixture.status,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      minute: fixture.status === 'finished' ? 90 : 0,
    } satisfies LegacyMatchSeed;
  });
};
