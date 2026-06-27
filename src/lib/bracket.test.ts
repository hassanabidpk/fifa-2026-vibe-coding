import { describe, expect, it } from 'vitest';
import { buildKnockoutBracket } from './bracket';
import { buildStandingsSnapshot, type Standing } from './standings';

const createStanding = (team: string, points: number, gd: number, flag = '🏳️'): Standing => ({
  team,
  flag,
  played: 3,
  won: Math.max(0, Math.min(3, Math.floor(points / 3))),
  drawn: points === 4 || points === 5 ? 1 : 0,
  lost: 0,
  goalsFor: gd >= 0 ? 5 + gd : 5,
  goalsAgainst: gd >= 0 ? 5 : 5 - gd,
  points,
});

describe('buildKnockoutBracket', () => {
  it('builds a full 32-team knockout bracket with correct progression labels', () => {
    const groups: Record<string, Standing[]> = {
      'Group A': [createStanding('Mexico', 9, 6, '🇲🇽'), createStanding('South Africa', 4, -1, '🇿🇦'), createStanding('Korea Republic', 3, -1, '🇰🇷'), createStanding('Czechia', 1, -4, '🇨🇿')],
      'Group B': [createStanding('Switzerland', 7, 4, '🇨🇭'), createStanding('Canada', 4, 5, '🇨🇦'), createStanding('Bosnia and Herzegovina', 4, -1, '🇧🇦'), createStanding('Qatar', 1, -8, '🇶🇦')],
      'Group C': [createStanding('Brazil', 7, 6, '🇧🇷'), createStanding('Morocco', 7, 3, '🇲🇦'), createStanding('Scotland', 3, -3, '🏴'), createStanding('Haiti', 0, -6, '🇭🇹')],
      'Group D': [createStanding('USA', 6, 4, '🇺🇸'), createStanding('Australia', 4, 0, '🇦🇺'), createStanding('Paraguay', 4, -2, '🇵🇾'), createStanding('Türkiye', 3, -2, '🇹🇷')],
      'Group E': [createStanding('Germany', 6, 6, '🇩🇪'), createStanding("Côte d'Ivoire", 6, 2, '🇨🇮'), createStanding('Ecuador', 4, 0, '🇪🇨'), createStanding('Curaçao', 1, -8, '🇨🇼')],
      'Group F': [createStanding('Netherlands', 7, 6, '🇳🇱'), createStanding('Japan', 5, 4, '🇯🇵'), createStanding('Sweden', 4, 0, '🇸🇪'), createStanding('Tunisia', 0, -10, '🇹🇳')],
      'Group G': [createStanding('Belgium', 5, 4, '🇧🇪'), createStanding('Egypt', 5, 2, '🇪🇬'), createStanding('IR Iran', 3, 0, '🇮🇷'), createStanding('New Zealand', 1, -6, '🇳🇿')],
      'Group H': [createStanding('Spain', 7, 5, '🇪🇸'), createStanding('Cabo Verde', 3, 0, '🇨🇻'), createStanding('Uruguay', 2, -1, '🇺🇾'), createStanding('Saudi Arabia', 2, -4, '🇸🇦')],
      'Group I': [createStanding('France', 9, 8, '🇫🇷'), createStanding('Norway', 6, 1, '🇳🇴'), createStanding('Senegal', 3, 2, '🇸🇳'), createStanding('Iraq', 0, -11, '🇮🇶')],
      'Group J': [createStanding('Argentina', 6, 5, '🇦🇷'), createStanding('Austria', 3, 0, '🇦🇹'), createStanding('Algeria', 3, -2, '🇩🇿'), createStanding('Jordan', 0, -3, '🇯🇴')],
      'Group K': [createStanding('Colombia', 6, 3, '🇨🇴'), createStanding('Portugal', 4, 5, '🇵🇹'), createStanding('Congo DR', 1, -1, '🇨🇩'), createStanding('Uzbekistan', 0, -7, '🇺🇿')],
      'Group L': [createStanding('England', 4, 2, '🏴'), createStanding('Ghana', 4, 1, '🇬🇭'), createStanding('Croatia', 3, -1, '🇭🇷'), createStanding('Panama', 0, -2, '🇵🇦')],
    };

    const snapshot = buildStandingsSnapshot(groups);
    const bracket = buildKnockoutBracket(snapshot);

    expect(bracket.map((round) => round.name)).toEqual(['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final']);
    expect(bracket[0].matches).toHaveLength(16);
    expect(bracket[1].matches).toHaveLength(8);
    expect(bracket[2].matches).toHaveLength(4);
    expect(bracket[3].matches).toHaveLength(2);
    expect(bracket[4].matches).toHaveLength(1);

    expect(bracket[0].matches[0]).toMatchObject({
      id: 'R32-1',
      homeTeam: 'Mexico',
      homeLabel: 'Group A #1',
    });
    expect(bracket[0].matches.some((match) => match.homeTeam === 'France' && match.awayLabel === 'Group J #2')).toBe(true);
    expect(bracket[0].matches.some((match) => match.homeTeam === 'Belgium' && match.awayLabel === 'Group H #2')).toBe(true);

    expect(bracket[1].matches[0]).toMatchObject({
      id: 'R16-1',
      homeLabel: 'Winner R32-1',
      awayLabel: 'Winner R32-2',
    });
    expect(bracket[2].matches[0]).toMatchObject({
      id: 'QF-1',
      homeLabel: 'Winner R16-1',
      awayLabel: 'Winner R16-2',
    });
    expect(bracket[3].matches[1]).toMatchObject({
      id: 'SF-2',
      homeLabel: 'Winner QF-3',
      awayLabel: 'Winner QF-4',
    });
    expect(bracket[4].matches[0]).toMatchObject({
      id: 'F-1',
      homeLabel: 'Winner SF-1',
      awayLabel: 'Winner SF-2',
    });
  });
});
