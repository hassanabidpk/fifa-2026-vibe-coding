import { describe, expect, it } from 'vitest';
import {
  advanceLiveMatch,
  createOrderedEvents,
  filterMatches,
  injectManualGoal,
  makeMatchLive,
  type FootballMatch,
} from './match-engine';

const baseMatch: FootballMatch = {
  id: 'm7',
  group: 'Group L',
  homeTeam: 'Panama',
  homeFlag: '🇵🇦',
  awayTeam: 'England',
  awayFlag: '🏴',
  dateSgt: 'Sun, Jun 28',
  timeSgt: '05:00 AM',
  stadium: 'MetLife Stadium',
  city: 'East Rutherford, NJ',
  status: 'live',
  homeScore: 0,
  awayScore: 1,
  minute: 54,
  events: [
    { type: 'goal', time: 32, team: 'away', player: 'Harry Kane', detail: 'Cool penalty conversion' },
    { type: 'card-yellow', time: 41, team: 'home', player: 'Aníbal Godoy' },
  ],
  stats: {
    possession: [38, 62],
    shots: [3, 9],
    shotsOnTarget: [0, 4],
    corners: [1, 5],
    fouls: [8, 5],
  },
};

describe('match-engine', () => {
  it('orders timeline events without mutating the original array', () => {
    const originalEvents = [...baseMatch.events];

    const ordered = createOrderedEvents(baseMatch.events);

    expect(ordered.map((event) => event.time)).toEqual([41, 32]);
    expect(baseMatch.events).toEqual(originalEvents);
    expect(ordered).not.toBe(baseMatch.events);
  });

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

  it('advances a live match to full time without mutating nested stats', () => {
    const previousShots = [...baseMatch.stats.shots] as [number, number];
    const previousShotsOnTarget = [...baseMatch.stats.shotsOnTarget] as [number, number];

    const result = advanceLiveMatch(baseMatch, {
      random: () => 0.99,
    });

    expect(result.match.minute).toBe(55);
    expect(result.match.status).toBe('live');
    expect(baseMatch.stats.shots).toEqual(previousShots);
    expect(baseMatch.stats.shotsOnTarget).toEqual(previousShotsOnTarget);
    expect(result.notifications).toEqual([]);
  });

  it('injects a manual goal for the selected side and updates stats consistently', () => {
    const updated = injectManualGoal(baseMatch, 'home', 54);

    expect(updated.homeScore).toBe(1);
    expect(updated.awayScore).toBe(1);
    expect(updated.stats.shots).toEqual([4, 9]);
    expect(updated.stats.shotsOnTarget).toEqual([1, 4]);
    expect(updated.events.at(-1)).toMatchObject({
      type: 'goal',
      time: 54,
      team: 'home',
    });
  });

  it('converts an upcoming match into a clean live kickoff state', () => {
    const upcoming: FootballMatch = {
      ...baseMatch,
      id: 'm10',
      status: 'upcoming',
      minute: 0,
      homeScore: 3,
      awayScore: 2,
      events: [{ type: 'goal', time: 12, team: 'away', player: 'Old Event' }],
      stats: {
        possession: [77, 23],
        shots: [12, 2],
        shotsOnTarget: [8, 1],
        corners: [6, 0],
        fouls: [1, 9],
      },
    };

    const live = makeMatchLive(upcoming);

    expect(live.status).toBe('live');
    expect(live.minute).toBe(1);
    expect(live.homeScore).toBe(0);
    expect(live.awayScore).toBe(0);
    expect(live.events).toEqual([]);
    expect(live.stats).toEqual({
      possession: [50, 50],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
    });
  });
});
