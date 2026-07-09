import { normalizeMatchTeamsAndScore, type PenaltyShootoutMetadata } from './match-display';

export interface KnockoutFixture extends Partial<PenaltyShootoutMetadata> {
  id: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  dateSgt: string;
  timeSgt: string;
  stadium: string;
  city: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
}

export interface KnockoutMatch extends PenaltyShootoutMetadata {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeLabel: string;
  awayLabel: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore: number;
  awayScore: number;
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

const KNOCKOUT_ROUNDS = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Third Place', 'Final'];

const fixtureNumber = (fixture: Pick<KnockoutFixture, 'id'>) => {
  const match = fixture.id.match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
};

const formatKickoffLabel = (fixture: Pick<KnockoutFixture, 'dateSgt' | 'timeSgt'>) => {
  const parts = [fixture.dateSgt, fixture.timeSgt].filter(Boolean);
  return parts.length > 0 ? `${parts.join(' · ')} SGT` : 'Kickoff TBD';
};

const formatVenueLabel = (fixture: Pick<KnockoutFixture, 'stadium' | 'city'>) => {
  const parts = [fixture.stadium, fixture.city].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Venue TBD';
};

const createMatch = (fixture: KnockoutFixture): KnockoutMatch => {
  const parsedPenaltyMetadata = normalizeMatchTeamsAndScore(fixture);
  return {
    ...parsedPenaltyMetadata,
    decidedByPenalties: parsedPenaltyMetadata.decidedByPenalties || fixture.decidedByPenalties === true,
    homePenaltyScore: parsedPenaltyMetadata.homePenaltyScore ?? fixture.homePenaltyScore ?? null,
    awayPenaltyScore: parsedPenaltyMetadata.awayPenaltyScore ?? fixture.awayPenaltyScore ?? null,
  id: `M${fixtureNumber(fixture)}`,
  homeFlag: fixture.homeFlag,
  awayFlag: fixture.awayFlag,
  homeLabel: formatKickoffLabel(fixture),
  awayLabel: formatVenueLabel(fixture),
  status: fixture.status,
  homeScore: fixture.homeScore,
  awayScore: fixture.awayScore,
  };
};

export const buildKnockoutBracket = (fixtures: KnockoutFixture[]): KnockoutRound[] =>
  KNOCKOUT_ROUNDS.map((roundName) => ({
    name: roundName,
    matches: fixtures
      .filter((fixture) => fixture.group === roundName)
      .sort((a, b) => fixtureNumber(a) - fixtureNumber(b))
      .map(createMatch),
  })).filter((round) => round.matches.length > 0);
