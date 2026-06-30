import { describe, expect, it } from 'vitest';
import {
  filterMatches,
  sortMatchesForDisplay,
  syncMatchStatuses,
  type FootballMatch,
} from './match-engine';

const baseMatch: FootballMatch = {
  id: 'm7',
  group: 'Group L',
  homeTeam: 'Panama',
  homeFlag: '🇵🇦',
  awayTeam: 'England',
  awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  dateSgt: 'Sun, Jun 28',
  timeSgt: '05:00 AM',
  stadium: 'MetLife Stadium',
  city: 'East Rutherford, NJ',
  status: 'live',
  homeScore: 0,
  awayScore: 1,
  minute: 54,
};

describe('match-engine', () => {
  it('filters matches by search query and active tab', () => {
    const matches: FootballMatch[] = [
      baseMatch,
      { ...baseMatch, id: 'm8', homeTeam: 'Croatia', awayTeam: 'Ghana', status: 'finished' },
      { ...baseMatch, id: 'm9', homeTeam: 'Colombia', awayTeam: 'Portugal', status: 'upcoming', group: 'Group K' },
    ];

    expect(filterMatches(matches, 'port', 'all').map((match) => match.id)).toEqual(['m9']);
    expect(filterMatches(matches, '', 'live').map((match) => match.id)).toEqual(['m7']);
    expect(filterMatches(matches, 'group l', 'finished').map((match) => match.id)).toEqual(['m8']);
  });

  it('sorts finished matches newest first for display', () => {
    const matches: FootballMatch[] = [
      { ...baseMatch, id: 'undated', dateSgt: '', timeSgt: '', status: 'finished' },
      { ...baseMatch, id: 'old', dateSgt: 'Sat, Jun 27', timeSgt: '11:00 AM', status: 'finished' },
      { ...baseMatch, id: 'late', dateSgt: 'Sun, Jun 28', timeSgt: '10:00 AM', status: 'finished' },
      { ...baseMatch, id: 'early', dateSgt: 'Sun, Jun 28', timeSgt: '07:30 AM', status: 'finished' },
    ];

    expect(sortMatchesForDisplay(matches, 'finished').map((match) => match.id)).toEqual(['late', 'early', 'old', 'undated']);
    expect(sortMatchesForDisplay(matches, 'all').map((match) => match.id)).toEqual(['undated', 'old', 'late', 'early']);
  });

  it('sorts upcoming matches chronologically ascending for display', () => {
    const matches: FootballMatch[] = [
      { ...baseMatch, id: 'undated', dateSgt: '', timeSgt: '', status: 'upcoming' },
      { ...baseMatch, id: 'old', dateSgt: 'Sat, Jun 27', timeSgt: '11:00 AM', status: 'upcoming' },
      { ...baseMatch, id: 'late', dateSgt: 'Sun, Jun 28', timeSgt: '10:00 AM', status: 'upcoming' },
      { ...baseMatch, id: 'early', dateSgt: 'Sun, Jun 28', timeSgt: '07:30 AM', status: 'upcoming' },
    ];

    expect(sortMatchesForDisplay(matches, 'upcoming').map((match) => match.id)).toEqual(['undated', 'old', 'early', 'late']);
  });

  it('keeps official finished matches finished while clock-syncing upcoming matches', () => {
    const matches: FootballMatch[] = [
      {
        ...baseMatch,
        id: 'm5',
        homeTeam: 'Egypt',
        awayTeam: 'Iran',
        dateSgt: 'Sat, Jun 27',
        timeSgt: '11:00 AM',
        status: 'finished',
        minute: 90,
        homeScore: 1,
        awayScore: 1,
      },
      { ...baseMatch, id: 'm6', homeTeam: 'New Zealand', awayTeam: 'Belgium', dateSgt: 'Sat, Jun 27', timeSgt: '11:00 AM', status: 'finished', minute: 90, homeScore: 0, awayScore: 3 },
      { ...baseMatch, id: 'm7', homeTeam: 'Panama', awayTeam: 'England', dateSgt: 'Sun, Jun 28', timeSgt: '05:00 AM', status: 'upcoming', minute: 0 },
      { ...baseMatch, id: 'm8', homeTeam: 'Croatia', awayTeam: 'Ghana', dateSgt: 'Sat, Jun 27', timeSgt: '11:00 AM', status: 'upcoming', minute: 0 },
    ];

    const synced = syncMatchStatuses(matches, new Date('2026-06-27T11:24:00+08:00'));

    expect(synced.map((match) => [match.id, match.status])).toEqual([
      ['m5', 'finished'],
      ['m6', 'finished'],
      ['m7', 'upcoming'],
      ['m8', 'live'],
    ]);
    expect(synced[0]).toMatchObject({ minute: 90, homeScore: 1, awayScore: 1 });
    expect(synced[1]).toMatchObject({ minute: 90, homeScore: 0, awayScore: 3 });
    expect(synced[3]).toMatchObject({ minute: 24 });
  });

  it('holds the live clock at halftime and resumes the second half after the break', () => {
    const match: FootballMatch = {
      ...baseMatch,
      id: 'm11',
      homeTeam: 'Egypt',
      awayTeam: 'Iran',
      dateSgt: 'Sat, Jun 27',
      timeSgt: '11:00 AM',
      status: 'live',
      minute: 70,
      homeScore: 1,
      awayScore: 1,
    };

    const duringHalftime = syncMatchStatuses([match], new Date('2026-06-27T11:53:00+08:00'))[0];
    const inSecondHalf = syncMatchStatuses([match], new Date('2026-06-27T12:08:00+08:00'))[0];

    expect(duringHalftime).toMatchObject({ status: 'live', minute: 45, homeScore: 1, awayScore: 1 });
    expect(inSecondHalf).toMatchObject({ status: 'live', minute: 53, homeScore: 1, awayScore: 1 });
  });

  it('preserves a seeded real score while syncing an active live match', () => {
    const match: FootballMatch = {
      ...baseMatch,
      id: 'm72',
      group: 'Group J',
      homeTeam: 'Jordan',
      awayTeam: 'Argentina',
      dateSgt: 'Sun, Jun 28',
      timeSgt: '10:00 AM',
      status: 'live',
      minute: 1,
      homeScore: 0,
      awayScore: 2,
    };

    const synced = syncMatchStatuses([match], new Date('2026-06-28T10:31:00+08:00'))[0];

    expect(synced).toMatchObject({ status: 'live', minute: 31, homeScore: 0, awayScore: 2 });
  });

  it('keeps official live matches active through extra time', () => {
    const match: FootballMatch = {
      ...baseMatch,
      id: 'm74',
      group: 'Round of 32',
      homeTeam: 'Germany',
      awayTeam: 'Paraguay',
      dateSgt: 'Tue, Jun 30',
      timeSgt: '04:30 AM',
      status: 'live',
      minute: 90,
      homeScore: 1,
      awayScore: 1,
    };

    const synced = syncMatchStatuses([match], new Date('2026-06-30T06:42:00+08:00'))[0];

    expect(synced).toMatchObject({ status: 'live', minute: 102, homeScore: 1, awayScore: 1 });
  });

  it('ends stale official live matches after the extra-time fallback window', () => {
    const match: FootballMatch = {
      ...baseMatch,
      id: 'm75',
      group: 'Round of 32',
      homeTeam: 'Netherlands',
      awayTeam: 'Morocco',
      dateSgt: 'Tue, Jun 30',
      timeSgt: '09:00 AM',
      status: 'live',
      minute: 90,
      homeScore: 1,
      awayScore: 1,
    };

    const synced = syncMatchStatuses([match], new Date('2026-06-30T12:00:00+08:00'))[0];

    expect(synced).toMatchObject({ status: 'finished', minute: 90, homeScore: 1, awayScore: 1 });
  });

  it('correctly parses and syncs matches with single-digit day numbers in July', () => {
    const matches: FootballMatch[] = [
      {
        ...baseMatch,
        id: 'm100',
        homeTeam: 'France',
        awayTeam: 'Sweden',
        dateSgt: 'Wed, Jul 1',
        timeSgt: '05:00 AM',
        status: 'upcoming',
      },
    ];

    const syncedBefore = syncMatchStatuses(matches, new Date('2026-06-29T12:00:00+08:00'))[0];
    expect(syncedBefore.status).toBe('upcoming');

    const syncedDuring = syncMatchStatuses(matches, new Date('2026-07-01T05:30:00+08:00'))[0];
    expect(syncedDuring.status).toBe('live');
    expect(syncedDuring.minute).toBe(30);

    const syncedAfter = syncMatchStatuses(matches, new Date('2026-07-01T10:00:00+08:00'))[0];
    expect(syncedAfter.status).toBe('finished');
  });
});
