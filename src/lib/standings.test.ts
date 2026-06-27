import { describe, expect, it } from 'vitest';
import {
  buildStandingsFromMatches,
  buildStandingsSnapshot,
  normalizeVenue,
  type GroupMatchLike,
  type Standing,
} from './standings';

const createStanding = (
  team: string,
  points: number,
  goalDifference: number,
  flag = '🏳️',
): Standing => ({
  team,
  flag,
  played: 3,
  won: Math.max(0, Math.min(3, points / 3)),
  drawn: points % 3,
  lost: 0,
  goalsFor: goalDifference >= 0 ? 5 + goalDifference : 5,
  goalsAgainst: goalDifference >= 0 ? 5 : 5 - goalDifference,
  points,
});

describe('standings', () => {
  it('builds live group tables directly from played group-stage match scores', () => {
    const matches: GroupMatchLike[] = [
      { group: 'Group G', homeTeam: 'Egypt', awayTeam: 'Iran', homeFlag: '🇪🇬', awayFlag: '🇮🇷', homeScore: 1, awayScore: 1, status: 'finished' },
      { group: 'Group G', homeTeam: 'New Zealand', awayTeam: 'Belgium', homeFlag: '🇳🇿', awayFlag: '🇧🇪', homeScore: 0, awayScore: 3, status: 'finished' },
      { group: 'Group H', homeTeam: 'Cape Verde', awayTeam: 'Saudi Arabia', homeFlag: '🇨🇻', awayFlag: '🇸🇦', homeScore: 1, awayScore: 1, status: 'finished' },
      { group: 'Group H', homeTeam: 'Uruguay', awayTeam: 'Spain', homeFlag: '🇺🇾', awayFlag: '🇪🇸', homeScore: 2, awayScore: 3, status: 'finished' },
      { group: 'Round of 32', homeTeam: 'Winner Group A', awayTeam: 'Best 3rd Place Team', homeFlag: '🏆', awayFlag: '⚽', homeScore: 0, awayScore: 0, status: 'upcoming' },
    ];

    const tables = buildStandingsFromMatches(matches);

    expect(Object.keys(tables)).toEqual(['Group G', 'Group H']);
    expect(tables['Group G']).toEqual([
      { team: 'Belgium', flag: '🇧🇪', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, points: 3 },
      { team: 'Egypt', flag: '🇪🇬', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
      { team: 'Iran', flag: '🇮🇷', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
      { team: 'New Zealand', flag: '🇳🇿', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, points: 0 },
    ]);
    expect(tables['Group H'][0].team).toBe('Spain');
    expect(tables['Group H'][2].team).toBe('Saudi Arabia');
  });

  it('ranks only currently available third-placed teams from the live group tables', () => {
    const tables: Record<string, Standing[]> = {
      'Group G': [
        { team: 'Belgium', flag: '🇧🇪', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, points: 3 },
        { team: 'Egypt', flag: '🇪🇬', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
        { team: 'Iran', flag: '🇮🇷', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
        { team: 'New Zealand', flag: '🇳🇿', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, points: 0 },
      ],
      'Group H': [
        { team: 'Spain', flag: '🇪🇸', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 2, points: 3 },
        { team: 'Cape Verde', flag: '🇨🇻', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
        { team: 'Saudi Arabia', flag: '🇸🇦', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1 },
        { team: 'Uruguay', flag: '🇺🇾', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 3, points: 0 },
      ],
      'Group I': [
        { team: 'Senegal', flag: '🇸🇳', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3 },
        { team: 'France', flag: '🇫🇷', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3 },
        { team: 'Norway', flag: '🇳🇴', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0 },
        { team: 'Iraq', flag: '🇮🇶', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0 },
      ],
    };

    const snapshot = buildStandingsSnapshot(tables);

    expect(snapshot.bestThirdPlaceTeams.map((team: { team: string }) => team.team)).toEqual(['Iran', 'Saudi Arabia', 'Norway']);
    expect(snapshot.bestThirdPlaceTeams).toHaveLength(3);
  });

  it('normalizes host venues to FIFA 2026 display names', () => {
    expect(normalizeVenue('Mercedes-Benz Stadium', 'Atlanta, GA')).toEqual({
      stadium: 'Atlanta Stadium',
      city: 'Atlanta',
    });
    expect(normalizeVenue('Lincoln Financial Field', 'Philadelphia, PA')).toEqual({
      stadium: 'Philadelphia Stadium',
      city: 'Philadelphia',
    });
  });

  it('exposes the full third-place ranking while marking only the best eight as qualifiers', () => {
    const standingsByGroup: Record<string, Standing[]> = {
      'Group A': [createStanding('A1', 7, 4), createStanding('A2', 6, 3), createStanding('A3', 5, 2), createStanding('A4', 1, -5)],
      'Group B': [createStanding('B1', 7, 4), createStanding('B2', 6, 3), createStanding('B3', 4, 1), createStanding('B4', 0, -6)],
      'Group C': [createStanding('C1', 9, 5), createStanding('C2', 6, 2), createStanding('C3', 4, 0), createStanding('C4', 1, -4)],
      'Group D': [createStanding('D1', 7, 3), createStanding('D2', 5, 1), createStanding('D3', 4, -1), createStanding('D4', 0, -3)],
      'Group E': [createStanding('E1', 9, 6), createStanding('E2', 6, 2), createStanding('E3', 3, 0), createStanding('E4', 0, -8)],
      'Group F': [createStanding('F1', 7, 4), createStanding('F2', 6, 1), createStanding('F3', 3, -1), createStanding('F4', 1, -4)],
      'Group G': [createStanding('G1', 8, 4), createStanding('G2', 5, 1), createStanding('G3', 3, -2), createStanding('G4', 0, -3)],
      'Group H': [createStanding('H1', 8, 4), createStanding('H2', 6, 2), createStanding('H3', 3, -1), createStanding('H4', 1, -4)],
      'Group I': [createStanding('I1', 7, 4), createStanding('I2', 5, 1), createStanding('I3', 2, -1), createStanding('I4', 1, -4)],
      'Group J': [createStanding('J1', 9, 5), createStanding('J2', 4, 0), createStanding('J3', 2, -2), createStanding('J4', 1, -3)],
      'Group K': [createStanding('K1', 7, 2), createStanding('K2', 4, 0), createStanding('K3', 1, -3), createStanding('K4', 1, -4)],
      'Group L': [createStanding('L1', 6, 2), createStanding('L2', 5, 0), createStanding('L3', 1, -2), createStanding('L4', 0, -5)],
    };

    const snapshot = buildStandingsSnapshot(standingsByGroup);

    expect(snapshot.thirdPlaceTeams).toHaveLength(12);
    expect(snapshot.bestThirdPlaceTeams).toHaveLength(8);
    expect([...snapshot.bestThirdPlaceTeams.map((team: { team: string }) => team.team)].sort()).toEqual([
      'A3',
      'B3',
      'C3',
      'D3',
      'E3',
      'F3',
      'G3',
      'H3',
    ]);
    expect(snapshot.thirdPlaceTeams[0].team).toBe('A3');
    expect(snapshot.thirdPlaceTeams.at(-1)?.team).toBe('K3');
    expect(snapshot.groups['Group A'][0].qualificationStatus).toBe('qualified');
    expect(snapshot.groups['Group A'][1].qualificationStatus).toBe('qualified');
    expect(snapshot.groups['Group A'][2].qualificationStatus).toBe('best-third');
    expect(snapshot.groups['Group I'][2].qualificationStatus).toBe('eliminated');
    expect(snapshot.groups['Group L'][2].qualificationStatus).toBe('eliminated');
  });
});
