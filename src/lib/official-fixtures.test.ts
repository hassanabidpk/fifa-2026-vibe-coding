import { describe, expect, it } from 'vitest';
import { buildOfficialMatchSeeds, type LegacyMatchSeed, type OfficialFixtureSeed } from './official-fixtures';

const legacyMatch = (overrides: Partial<LegacyMatchSeed>): LegacyMatchSeed => ({
  id: 'm1',
  group: 'Group A',
  homeTeam: 'Mexico',
  homeFlag: '🇲🇽',
  awayTeam: 'South Africa',
  awayFlag: '🇿🇦',
  dateSgt: 'Fri, Jun 12',
  timeSgt: '12:00 AM',
  stadium: 'Mexico City Stadium',
  city: 'Mexico City',
  status: 'finished',
  homeScore: 0,
  awayScore: 0,
  minute: 90,
  ...overrides,
});

const officialFixture = (overrides: Partial<OfficialFixtureSeed>): OfficialFixtureSeed => ({
  sourceUrl: 'https://www.fifa.com/example',
  matchNumber: null,
  group: 'Group A',
  homeTeam: 'Mexico',
  awayTeam: 'South Africa',
  dateSgt: '',
  timeSgt: '',
  stadium: 'Mexico City Stadium',
  city: '',
  status: 'finished',
  homeScore: 2,
  awayScore: 0,
  ...overrides,
});

describe('buildOfficialMatchSeeds', () => {
  it('preserves legacy flags and kickoff metadata while applying official result updates', () => {
    const results = buildOfficialMatchSeeds(
      [legacyMatch({ homeScore: 1, awayScore: 1, status: 'live', minute: 54 })],
      [officialFixture({ homeScore: 2, awayScore: 0, status: 'finished' })],
    );

    expect(results).toEqual([
      expect.objectContaining({
        id: 'm1',
        homeFlag: '🇲🇽',
        awayFlag: '🇿🇦',
        dateSgt: 'Fri, Jun 12',
        timeSgt: '12:00 AM',
        city: 'Mexico City',
        status: 'finished',
        homeScore: 2,
        awayScore: 0,
        minute: 90,
      }),
    ]);
  });

  it('creates new seeded knockout matches from official fixtures when no legacy stub exists', () => {
    const results = buildOfficialMatchSeeds(
      [legacyMatch({ homeTeam: 'Canada', homeFlag: '🇨🇦', awayTeam: 'Bosnia and Herzegovina', awayFlag: '🇧🇦' })],
      [
        officialFixture({
          matchNumber: 80,
          group: 'Round of 32',
          homeTeam: 'Group L winners',
          awayTeam: 'Group E/H/I/J/K third place',
          dateSgt: 'Wed, Jul 1',
          timeSgt: '09:00 AM',
          stadium: 'Atlanta Stadium',
          city: 'Atlanta',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0,
        }),
      ],
    );

    expect(results).toEqual([
      expect.objectContaining({
        id: 'm80',
        group: 'Round of 32',
        homeFlag: '🏆',
        awayFlag: '🏆',
        dateSgt: 'Wed, Jul 1',
        timeSgt: '09:00 AM',
        city: 'Atlanta',
        minute: 0,
      }),
    ]);
  });
});
