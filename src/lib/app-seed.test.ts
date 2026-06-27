import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';
import { buildStandingsFromMatches, buildStandingsSnapshot, type GroupMatchLike } from './standings';

const extractSeededGroupMatches = (): GroupMatchLike[] => {
  const matchPattern = /group:\s*'(Group [A-L])'[\s\S]*?homeTeam:\s*(['"])(.*?)\2[\s\S]*?homeFlag:\s*'([^']+)'[\s\S]*?awayTeam:\s*(['"])(.*?)\5[\s\S]*?awayFlag:\s*'([^']+)'[\s\S]*?status:\s*'(upcoming|live|finished)'[\s\S]*?homeScore:\s*(\d+)[\s\S]*?awayScore:\s*(\d+)/g;

  return [...appSource.matchAll(matchPattern)].map((match) => ({
    group: match[1],
    homeTeam: match[3],
    homeFlag: match[4],
    awayTeam: match[6],
    awayFlag: match[7],
    status: match[8] as GroupMatchLike['status'],
    homeScore: Number(match[9]),
    awayScore: Number(match[10]),
  }));
};

describe('seeded FIFA group-stage data', () => {
  it('covers all 12 groups and yields a full third-place ranking from the seeded matches', () => {
    const seededMatches = extractSeededGroupMatches();
    const standings = buildStandingsFromMatches(seededMatches);
    const snapshot = buildStandingsSnapshot(standings);

    expect([...Object.keys(standings)].sort()).toEqual([
      'Group A',
      'Group B',
      'Group C',
      'Group D',
      'Group E',
      'Group F',
      'Group G',
      'Group H',
      'Group I',
      'Group J',
      'Group K',
      'Group L',
    ]);
    expect(snapshot.thirdPlaceTeams).toHaveLength(12);

    expect(standings['Group A'].map((team) => [team.team, team.points])).toEqual([
      ['Mexico', 9],
      ['South Africa', 4],
      ['Korea Republic', 3],
      ['Czechia', 1],
    ]);
    expect(standings['Group B'].map((team) => [team.team, team.points])).toEqual([
      ['Switzerland', 7],
      ['Canada', 4],
      ['Bosnia and Herzegovina', 4],
      ['Qatar', 1],
    ]);
    expect(standings['Group G'].map((team) => [team.team, team.points])).toEqual([
      ['Belgium', 5],
      ['Egypt', 5],
      ['IR Iran', 3],
      ['New Zealand', 1],
    ]);
    expect(standings['Group L'].map((team) => [team.team, team.points])).toEqual([
      ['England', 4],
      ['Ghana', 4],
      ['Croatia', 3],
      ['Panama', 0],
    ]);
  });
});
