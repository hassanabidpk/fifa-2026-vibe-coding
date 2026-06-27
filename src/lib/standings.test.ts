import { describe, expect, it } from 'vitest';
import {
  buildStandingsSnapshot,
  normalizeVenue,
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

  it('marks top two teams plus the best eight third-placed teams as Round of 32 qualifiers', () => {
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
    expect(snapshot.groups['Group A'][0].qualificationStatus).toBe('qualified');
    expect(snapshot.groups['Group A'][1].qualificationStatus).toBe('qualified');
    expect(snapshot.groups['Group A'][2].qualificationStatus).toBe('best-third');
    expect(snapshot.groups['Group I'][2].qualificationStatus).toBe('eliminated');
    expect(snapshot.groups['Group L'][2].qualificationStatus).toBe('eliminated');
  });
});
