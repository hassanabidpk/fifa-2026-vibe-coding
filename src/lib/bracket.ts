import type { RankedStanding, StandingsSnapshot } from './standings';

export interface KnockoutMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeLabel: string;
  awayLabel: string;
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

const findQualified = (snapshot: StandingsSnapshot, group: string, position: number): RankedStanding => {
  const team = snapshot.groups[group]?.find((entry) => entry.position === position);
  if (!team) throw new Error(`Missing ${group} position ${position}`);
  return team;
};

const bestThird = (snapshot: StandingsSnapshot, index: number): RankedStanding => {
  const team = snapshot.bestThirdPlaceTeams[index];
  if (!team) throw new Error(`Missing best third-place team at index ${index}`);
  return team;
};

const createMatch = (id: string, home: RankedStanding, away: RankedStanding): KnockoutMatch => ({
  id,
  homeTeam: home.team,
  awayTeam: away.team,
  homeFlag: home.flag,
  awayFlag: away.flag,
  homeLabel: `${home.group} #${home.position}`,
  awayLabel: `${away.group} #${away.position}`,
});

const createWinnerMatch = (id: string, homeSource: string, awaySource: string): KnockoutMatch => ({
  id,
  homeTeam: homeSource,
  awayTeam: awaySource,
  homeFlag: '🏆',
  awayFlag: '🏆',
  homeLabel: `Winner ${homeSource}`,
  awayLabel: `Winner ${awaySource}`,
});

export const buildKnockoutBracket = (snapshot: StandingsSnapshot): KnockoutRound[] => {
  const roundOf32: KnockoutMatch[] = [
    createMatch('R32-1', findQualified(snapshot, 'Group A', 1), bestThird(snapshot, 6)),
    createMatch('R32-2', findQualified(snapshot, 'Group B', 1), bestThird(snapshot, 5)),
    createMatch('R32-3', findQualified(snapshot, 'Group C', 1), bestThird(snapshot, 4)),
    createMatch('R32-4', findQualified(snapshot, 'Group D', 1), bestThird(snapshot, 3)),
    createMatch('R32-5', findQualified(snapshot, 'Group E', 1), bestThird(snapshot, 2)),
    createMatch('R32-6', findQualified(snapshot, 'Group F', 1), bestThird(snapshot, 1)),
    createMatch('R32-7', findQualified(snapshot, 'Group H', 1), bestThird(snapshot, 0)),
    createMatch('R32-8', findQualified(snapshot, 'Group L', 1), bestThird(snapshot, 7)),
    createMatch('R32-9', findQualified(snapshot, 'Group I', 1), findQualified(snapshot, 'Group J', 2)),
    createMatch('R32-10', findQualified(snapshot, 'Group J', 1), findQualified(snapshot, 'Group I', 2)),
    createMatch('R32-11', findQualified(snapshot, 'Group K', 1), findQualified(snapshot, 'Group L', 2)),
    createMatch('R32-12', findQualified(snapshot, 'Group G', 1), findQualified(snapshot, 'Group H', 2)),
    createMatch('R32-13', findQualified(snapshot, 'Group A', 2), findQualified(snapshot, 'Group B', 2)),
    createMatch('R32-14', findQualified(snapshot, 'Group C', 2), findQualified(snapshot, 'Group D', 2)),
    createMatch('R32-15', findQualified(snapshot, 'Group E', 2), findQualified(snapshot, 'Group F', 2)),
    createMatch('R32-16', findQualified(snapshot, 'Group G', 2), findQualified(snapshot, 'Group K', 2)),
  ];

  const roundOf16: KnockoutMatch[] = [
    createWinnerMatch('R16-1', 'R32-1', 'R32-2'),
    createWinnerMatch('R16-2', 'R32-3', 'R32-4'),
    createWinnerMatch('R16-3', 'R32-5', 'R32-6'),
    createWinnerMatch('R16-4', 'R32-7', 'R32-8'),
    createWinnerMatch('R16-5', 'R32-9', 'R32-10'),
    createWinnerMatch('R16-6', 'R32-11', 'R32-12'),
    createWinnerMatch('R16-7', 'R32-13', 'R32-14'),
    createWinnerMatch('R16-8', 'R32-15', 'R32-16'),
  ];

  const quarterfinals: KnockoutMatch[] = [
    createWinnerMatch('QF-1', 'R16-1', 'R16-2'),
    createWinnerMatch('QF-2', 'R16-3', 'R16-4'),
    createWinnerMatch('QF-3', 'R16-5', 'R16-6'),
    createWinnerMatch('QF-4', 'R16-7', 'R16-8'),
  ];

  const semifinals: KnockoutMatch[] = [
    createWinnerMatch('SF-1', 'QF-1', 'QF-2'),
    createWinnerMatch('SF-2', 'QF-3', 'QF-4'),
  ];

  const final: KnockoutMatch[] = [createWinnerMatch('F-1', 'SF-1', 'SF-2')];

  return [
    { name: 'Round of 32', matches: roundOf32 },
    { name: 'Round of 16', matches: roundOf16 },
    { name: 'Quarterfinals', matches: quarterfinals },
    { name: 'Semifinals', matches: semifinals },
    { name: 'Final', matches: final },
  ];
};
