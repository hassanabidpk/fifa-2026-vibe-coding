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
  decidedByPenalties: false,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  minute: 90,
  ...overrides,
}) as LegacyMatchSeed;

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
  decidedByPenalties: false,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  ...overrides,
}) as OfficialFixtureSeed;

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

  it('applies live official scores without dropping the in-progress match state', () => {
    const results = buildOfficialMatchSeeds(
      [legacyMatch({ homeScore: 0, awayScore: 0, status: 'live', minute: 45 })],
      [officialFixture({ status: 'live', homeScore: 0, awayScore: 1 })],
    );

    expect(results).toEqual([
      expect.objectContaining({
        status: 'live',
        homeScore: 0,
        awayScore: 1,
        minute: 0,
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

  it('resolves flags and penalty metadata when official team names contain result suffixes', () => {
    const results = buildOfficialMatchSeeds(
      [
        legacyMatch({ group: 'Group D', homeTeam: 'Paraguay', homeFlag: '🇵🇾', awayTeam: 'Australia', awayFlag: '🇦🇺', stadium: 'Boston Stadium' }),
        legacyMatch({ group: 'Group C', homeTeam: 'Brazil', homeFlag: '🇧🇷', awayTeam: 'Morocco', awayFlag: '🇲🇦', stadium: 'Estadio Monterrey' }),
      ],
      [
        officialFixture({
          group: 'Round of 32',
          homeTeam: 'Germany',
          awayTeam: 'Paraguay (PSO 3-4)',
          stadium: 'Boston Stadium',
          status: 'finished',
        }),
        officialFixture({
          group: 'Round of 32',
          homeTeam: 'Netherlands',
          awayTeam: 'Morocco (PSO 2-3)',
          stadium: 'Estadio Monterrey',
          status: 'finished',
        }),
      ],
    );

    expect(results).toEqual([
      expect.objectContaining({
        awayTeam: 'Paraguay',
        awayFlag: '🇵🇾',
        decidedByPenalties: true,
        homePenaltyScore: 3,
        awayPenaltyScore: 4,
      }),
      expect.objectContaining({
        awayTeam: 'Morocco',
        awayFlag: '🇲🇦',
        decidedByPenalties: true,
        homePenaltyScore: 2,
        awayPenaltyScore: 3,
      }),
    ]);
  });

  it('resolves flags across apostrophe variants in official team names', () => {
    const results = buildOfficialMatchSeeds(
      [legacyMatch({ homeTeam: "Côte d'Ivoire", homeFlag: '🇨🇮', awayTeam: 'Ecuador', awayFlag: '🇪🇨' })],
      [officialFixture({ homeTeam: 'Côte d’Ivoire', awayTeam: 'Norway' })],
    );

    expect(results[0].homeFlag).toBe('🇨🇮');
  });
});
