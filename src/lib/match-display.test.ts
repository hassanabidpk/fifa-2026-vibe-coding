import { describe, expect, it } from 'vitest';
import {
  formatMatchScoreline,
  getPenaltyShootoutOutcome,
  normalizeMatchTeamsAndScore,
} from './match-display';

describe('normalizeMatchTeamsAndScore', () => {
  it('extracts penalty shootout scores from official FIFA team suffixes and cleans the team labels', () => {
    expect(
      normalizeMatchTeamsAndScore({
        homeTeam: 'Germany',
        awayTeam: 'Paraguay (PSO 3-4)',
      }),
    ).toEqual({
      homeTeam: 'Germany',
      awayTeam: 'Paraguay',
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
      decidedByPenalties: true,
    });
  });

  it('leaves regular results untouched when no shootout suffix exists', () => {
    expect(
      normalizeMatchTeamsAndScore({
        homeTeam: 'France',
        awayTeam: 'Morocco',
      }),
    ).toEqual({
      homeTeam: 'France',
      awayTeam: 'Morocco',
      homePenaltyScore: null,
      awayPenaltyScore: null,
      decidedByPenalties: false,
    });
  });
});

describe('getPenaltyShootoutOutcome', () => {
  it('returns a readable penalty summary only for resolved shootouts', () => {
    expect(getPenaltyShootoutOutcome({ decidedByPenalties: true, homePenaltyScore: 2, awayPenaltyScore: 4 })).toBe(
      'Pens 2-4',
    );
    expect(getPenaltyShootoutOutcome({ decidedByPenalties: false, homePenaltyScore: null, awayPenaltyScore: null })).toBeNull();
  });
});

describe('formatMatchScoreline', () => {
  it('includes penalty shootout results for finished matches', () => {
    expect(
      formatMatchScoreline({
        status: 'finished',
        homeScore: 1,
        awayScore: 1,
        decidedByPenalties: true,
        homePenaltyScore: 3,
        awayPenaltyScore: 4,
      }),
    ).toBe('1 - 1 (Pens 3-4)');
  });

  it('keeps regular formatting for upcoming and non-shootout matches', () => {
    expect(
      formatMatchScoreline({
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
        decidedByPenalties: false,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      }),
    ).toBe('Not started');
    expect(
      formatMatchScoreline({
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
        decidedByPenalties: false,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      }),
    ).toBe('2 - 1');
  });
});
