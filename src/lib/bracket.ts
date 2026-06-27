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

export const buildKnockoutBracket = (snapshot: StandingsSnapshot): KnockoutRound[] => {
  const roundOf32: KnockoutMatch[] = [
    createMatch('R32-1', findQualified(snapshot, 'Group A', 1), bestThird(snapshot, 6)),
    createMatch('R32-2', findQualified(snapshot, 'Group B', 1), bestThird(snapshot, 5)),
    createMatch('R32-3', findQualified(snapshot, 'Group C', 1), bestThird(snapshot, 4)),
    createMatch('R32-4', findQualified(snapshot, 'Group D', 1), bestThird(snapshot, 3)),
    createMatch('R32-5', findQualified(snapshot, 'Group E', 1), bestThird(snapshot, 2)),
    createMatch('R32-6', findQualified(snapshot, 'Group F', 1), bestThird(snapshot, 1)),
    createMatch('R32-7', findQualified(snapshot, 'Group G', 1), bestThird(snapshot, 0)),
    createMatch('R32-8', findQualified(snapshot, 'Group H', 1), findQualified(snapshot, 'Group I', 2)),
  ];

  const roundOf16: KnockoutMatch[] = [
    { id: 'R16-1', homeTeam: findQualified(snapshot, 'Group I', 1).team, awayTeam: findQualified(snapshot, 'Group H', 2).team, homeFlag: findQualified(snapshot, 'Group I', 1).flag, awayFlag: findQualified(snapshot, 'Group H', 2).flag, homeLabel: `${findQualified(snapshot, 'Group I', 1).group} #1`, awayLabel: `${findQualified(snapshot, 'Group H', 2).group} #2` },
    { id: 'R16-2', homeTeam: findQualified(snapshot, 'Group J', 1).team, awayTeam: findQualified(snapshot, 'Group G', 2).team, homeFlag: findQualified(snapshot, 'Group J', 1).flag, awayFlag: findQualified(snapshot, 'Group G', 2).flag, homeLabel: `${findQualified(snapshot, 'Group J', 1).group} #1`, awayLabel: `${findQualified(snapshot, 'Group G', 2).group} #2` },
    { id: 'R16-3', homeTeam: findQualified(snapshot, 'Group K', 1).team, awayTeam: findQualified(snapshot, 'Group F', 2).team, homeFlag: findQualified(snapshot, 'Group K', 1).flag, awayFlag: findQualified(snapshot, 'Group F', 2).flag, homeLabel: `${findQualified(snapshot, 'Group K', 1).group} #1`, awayLabel: `${findQualified(snapshot, 'Group F', 2).group} #2` },
    { id: 'R16-4', homeTeam: findQualified(snapshot, 'Group L', 1).team, awayTeam: findQualified(snapshot, 'Group E', 2).team, homeFlag: findQualified(snapshot, 'Group L', 1).flag, awayFlag: findQualified(snapshot, 'Group E', 2).flag, homeLabel: `${findQualified(snapshot, 'Group L', 1).group} #1`, awayLabel: `${findQualified(snapshot, 'Group E', 2).group} #2` },
  ];

  const quarterfinals: KnockoutMatch[] = [
    { id: 'QF-1', homeTeam: roundOf32[0].homeTeam, awayTeam: 'Winner R32-2', homeFlag: roundOf32[0].homeFlag, awayFlag: '🏆', homeLabel: 'Winner R32-1', awayLabel: 'Winner R32-2' },
    { id: 'QF-2', homeTeam: roundOf32[2].homeTeam, awayTeam: 'Winner R32-4', homeFlag: roundOf32[2].homeFlag, awayFlag: '🏆', homeLabel: 'Winner R32-3', awayLabel: 'Winner R32-4' },
  ];

  const semifinals: KnockoutMatch[] = [
    { id: 'SF-1', homeTeam: quarterfinals[0].homeTeam, awayTeam: 'Winner QF-2', homeFlag: quarterfinals[0].homeFlag, awayFlag: '🏆', homeLabel: 'Winner QF-1', awayLabel: 'Winner QF-2' },
  ];

  const final: KnockoutMatch[] = [
    { id: 'F-1', homeTeam: semifinals[0].homeTeam, awayTeam: 'Winner R32-7', homeFlag: semifinals[0].homeFlag, awayFlag: '🏆', homeLabel: 'Winner SF-1', awayLabel: 'Winner R32-7' },
  ];

  return [
    { name: 'Round of 32', matches: roundOf32 },
    { name: 'Round of 16', matches: roundOf16 },
    { name: 'Quarterfinals', matches: quarterfinals },
    { name: 'Semifinals', matches: semifinals },
    { name: 'Final', matches: final },
  ];
};
