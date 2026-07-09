import { describe, expect, it } from 'vitest';
import { buildKnockoutBracket, type KnockoutFixture } from './bracket';

const fixture = (overrides: Partial<KnockoutFixture>): KnockoutFixture => ({
  id: 'm73',
  group: 'Round of 32',
  homeTeam: 'South Africa',
  awayTeam: 'Canada',
  homeFlag: '🇿🇦',
  awayFlag: '🇨🇦',
  dateSgt: 'Mon, Jun 29',
  timeSgt: '03:00 AM',
  stadium: 'Los Angeles Stadium',
  city: 'Los Angeles',
  status: 'finished',
  homeScore: 0,
  awayScore: 1,
  decidedByPenalties: false,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  ...overrides,
}) as KnockoutFixture;

describe('buildKnockoutBracket', () => {
  it('builds knockout rounds from official fixture pairings instead of projected standings', () => {
    const bracket = buildKnockoutBracket([
      fixture({ id: 'm75', homeTeam: 'Netherlands', awayTeam: 'Morocco (PSO 2-3)', homeFlag: '🇳🇱', awayFlag: '🇲🇦' }),
      fixture({ id: 'm74', homeTeam: 'Germany', awayTeam: 'Paraguay (PSO 3-4)', homeFlag: '🇩🇪', awayFlag: '🇵🇾', homeScore: 1 }),
      fixture({ id: 'm89', group: 'Round of 16', homeTeam: 'Paraguay', awayTeam: 'France', homeFlag: '🇵🇾', awayFlag: '🇫🇷', dateSgt: 'Sun, Jul 5', timeSgt: '05:00 AM', status: 'upcoming', homeScore: 0, awayScore: 0 }),
      fixture({ id: 'm90', group: 'Round of 16', homeTeam: 'Canada', awayTeam: 'Morocco', homeFlag: '🇨🇦', awayFlag: '🇲🇦', dateSgt: 'Sun, Jul 5', timeSgt: '01:00 AM', status: 'upcoming', homeScore: 0, awayScore: 0 }),
      fixture({ id: 'm97', group: 'Quarterfinals', homeTeam: 'Winner match 89', awayTeam: 'Winner match 90', homeFlag: '🏆', awayFlag: '🏆', dateSgt: 'Fri, Jul 10', timeSgt: '04:00 AM', status: 'upcoming', homeScore: 0, awayScore: 0 }),
      fixture({ id: 'm104', group: 'Final', homeTeam: 'Winner match 101', awayTeam: 'Winner match 102', homeFlag: '🏆', awayFlag: '🏆', dateSgt: 'Mon, Jul 20', timeSgt: '03:00 AM', status: 'upcoming', homeScore: 0, awayScore: 0 }),
    ]);

    expect(bracket.map((round) => round.name)).toEqual(['Round of 32', 'Round of 16', 'Quarterfinals', 'Final']);
    expect(bracket[0].matches.map((match) => match.id)).toEqual(['M74', 'M75']);
    expect(bracket[0].matches[0]).toMatchObject({
      homeTeam: 'Germany',
      awayTeam: 'Paraguay',
      awayFlag: '🇵🇾',
      status: 'finished',
      homeScore: 1,
      awayScore: 1,
      decidedByPenalties: true,
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
    });
    expect(bracket[1].matches.map((match) => `${match.homeTeam} vs ${match.awayTeam}`)).toEqual([
      'Paraguay vs France',
      'Canada vs Morocco',
    ]);
  });

  it('includes official kickoff and venue metadata as bracket labels', () => {
    const bracket = buildKnockoutBracket([
      fixture({
        id: 'm91',
        group: 'Round of 16',
        homeTeam: 'Brazil',
        awayTeam: 'Norway',
        homeFlag: '🇧🇷',
        awayFlag: '🇳🇴',
        dateSgt: 'Mon, Jul 6',
        timeSgt: '04:00 AM',
        stadium: 'New York New Jersey Stadium',
        city: 'New Jersey',
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
      }),
    ]);

    expect(bracket[0].matches[0]).toMatchObject({
      id: 'M91',
      homeLabel: 'Mon, Jul 6 · 04:00 AM SGT',
      awayLabel: 'New York New Jersey Stadium · New Jersey',
    });
  });
});
